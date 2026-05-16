import { Prisma } from "@prisma/client";
import ExcelJS from "exceljs";
import { prisma } from "../../prisma/client";
import { AppError } from "../../utils/app-error";
import { createAuditLog } from "../audit/audit.service";
import { getPagination, getPaginationMeta, handlePrismaError } from "../hr/hr.utils";
import type { z } from "zod";
import type { quotationCreateSchema, quotationQuerySchema, quotationUpdateSchema } from "./quotations.schemas";

type QuotationQuery = z.infer<typeof quotationQuerySchema>;
type QuotationCreate = z.infer<typeof quotationCreateSchema>;
type QuotationUpdate = z.infer<typeof quotationUpdateSchema>;
type QuotationItemInput = QuotationCreate["items"][number];

interface RequestContext {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
}

const quotationInclude = {
  project: { select: { id: true, projectCode: true, name: true, customerName: true } },
  items: { orderBy: { lineIndex: "asc" as const } },
  images: { orderBy: { createdAt: "asc" as const } }
} satisfies Prisma.QuotationInclude;

const toDecimal = (value: number | string | Prisma.Decimal) => new Prisma.Decimal(value);
const money = (value: Prisma.Decimal) => value.toDecimalPlaces(2);
const quantity = (value: Prisma.Decimal) => value.toDecimalPlaces(3);

function dateCode(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

async function generateQuotationCode(quotationDate: Date) {
  const prefix = `Q-${dateCode(quotationDate)}-`;
  const existingCodes = await prisma.quotation.findMany({
    where: { quotationCode: { startsWith: prefix } },
    select: { quotationCode: true }
  });
  const nextSequence = existingCodes.reduce((max, quotation) => {
    const suffix = quotation.quotationCode.slice(prefix.length);
    const sequence = /^\d{3}$/.test(suffix) ? Number(suffix) : 0;
    return Math.max(max, sequence);
  }, 0) + 1;
  return `${prefix}${String(nextSequence).padStart(3, "0")}`;
}

export async function previewNextQuotationCode(date = new Date()) {
  return { quotationCode: await generateQuotationCode(date) };
}

function quotationWhere(query: QuotationQuery): Prisma.QuotationWhereInput {
  return {
    deletedAt: null,
    ...(query.projectId ? { projectId: query.projectId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { quotationCode: { contains: query.search, mode: "insensitive" } },
            { customerName: { contains: query.search, mode: "insensitive" } },
            { project: { projectCode: { contains: query.search, mode: "insensitive" } } },
            { project: { name: { contains: query.search, mode: "insensitive" } } }
          ]
        }
      : {}),
    ...(query.dateFrom || query.dateTo
      ? {
          quotationDate: {
            ...(query.dateFrom ? { gte: query.dateFrom } : {}),
            ...(query.dateTo ? { lte: query.dateTo } : {})
          }
        }
      : {})
  };
}

export async function listQuotations(query: QuotationQuery) {
  const where = quotationWhere(query);
  const pagination = getPagination(query);
  const [total, items] = await Promise.all([
    prisma.quotation.count({ where }),
    prisma.quotation.findMany({
      where,
      include: { project: quotationInclude.project },
      orderBy: [{ quotationDate: "desc" }, { createdAt: "desc" }],
      ...pagination
    })
  ]);
  return { items, meta: getPaginationMeta(query, total) };
}

export async function getQuotation(id: string) {
  const quotation = await prisma.quotation.findFirst({
    where: { id, deletedAt: null },
    include: quotationInclude
  });
  if (!quotation) throw new AppError(404, "Quotation not found.");
  return quotation;
}

async function ensureProject(projectId?: string) {
  if (!projectId) return;
  const project = await prisma.project.findFirst({ where: { id: projectId, deletedAt: null }, select: { id: true } });
  if (!project) throw new AppError(400, "Project does not exist.");
}

async function buildQuotationItems(items: QuotationItemInput[]) {
  const materialIds = Array.from(new Set(items.map((item) => item.materialId)));
  const materials = await prisma.inventoryItem.findMany({
    where: { id: { in: materialIds }, deletedAt: null },
    select: { id: true, materialCode: true, materialName: true, unit: true, sellingPrice: true }
  });
  const materialById = new Map(materials.map((material) => [material.id, material]));

  return items.map((item, index) => {
    const material = materialById.get(item.materialId);
    if (!material) throw new AppError(400, "Material does not exist.");
    const itemQuantity = quantity(toDecimal(item.quantity));
    const unitPrice = money(toDecimal(item.unitPrice ?? material.sellingPrice));
    const amount = money(itemQuantity.mul(unitPrice));
    return {
      lineIndex: index + 1,
      materialId: material.id,
      materialCodeSnapshot: material.materialCode,
      materialNameSnapshot: material.materialName,
      unitSnapshot: material.unit,
      quantity: itemQuantity,
      unitPrice,
      amount
    };
  });
}

function calculateTotals(items: Array<{ amount: Prisma.Decimal }>, numberOfSetsInput: number, vatEnabled: boolean, vatRateInput: number) {
  const numberOfSets = quantity(toDecimal(numberOfSetsInput));
  const vatRate = toDecimal(vatRateInput).toDecimalPlaces(3);
  const subtotalOneSet = money(items.reduce((sum, item) => sum.add(item.amount), new Prisma.Decimal(0)));
  const totalBeforeVat = money(subtotalOneSet.mul(numberOfSets));
  const vatAmount = vatEnabled ? money(totalBeforeVat.mul(vatRate).div(100)) : new Prisma.Decimal(0);
  const grandTotal = money(totalBeforeVat.add(vatAmount));
  return { numberOfSets, vatRate, subtotalOneSet, totalBeforeVat, vatAmount, grandTotal };
}

async function createWithCode(data: QuotationCreate, context: RequestContext) {
  await ensureProject(data.projectId);
  const quotationCode = await generateQuotationCode(data.quotationDate);
  const items = await buildQuotationItems(data.items);
  const totals = calculateTotals(items, data.numberOfSets, data.vatEnabled, data.vatRate);

  const quotation = await prisma.$transaction(async (tx) =>
    tx.quotation.create({
      data: {
        quotationCode,
        projectId: data.projectId,
        customerName: data.customerName,
        customerRequest: data.customerRequest,
        quotationDate: data.quotationDate,
        vatEnabled: data.vatEnabled,
        status: data.status,
        signatureImageUrl: data.signatureImageUrl,
        createdById: context.actorId,
        updatedById: context.actorId,
        ...totals,
        items: { create: items }
      },
      include: quotationInclude
    })
  );

  await createAuditLog({
    actorId: context.actorId,
    action: "create",
    module: "quotations",
    targetType: "quotation",
    targetId: quotation.id,
    newValue: quotation,
    metadata: { quotationCode, itemCount: quotation.items.length, grandTotal: quotation.grandTotal },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return quotation;
}

export async function createQuotation(data: QuotationCreate, context: RequestContext) {
  try {
    return await createWithCode(data, context);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      try {
        return await createWithCode(data, context);
      } catch (retryError) {
        if (retryError instanceof Prisma.PrismaClientKnownRequestError && retryError.code === "P2002") {
          throw new AppError(409, "Quotation Code already exists. Please try again.");
        }
        handlePrismaError(retryError);
      }
    }
    handlePrismaError(error);
  }
}

export async function updateQuotation(id: string, data: QuotationUpdate, context: RequestContext) {
  const existing = await getQuotation(id);
  await ensureProject(data.projectId);
  const nextItems = data.items ? await buildQuotationItems(data.items) : existing.items;
  const totals = calculateTotals(
    nextItems.map((item) => ({ amount: toDecimal(item.amount) })),
    data.numberOfSets ?? Number(existing.numberOfSets),
    data.vatEnabled ?? existing.vatEnabled,
    data.vatRate ?? Number(existing.vatRate)
  );

  const quotation = await prisma.$transaction(async (tx) => {
    if (data.items) {
      await tx.quotationItem.deleteMany({ where: { quotationId: id } });
    }
    return tx.quotation.update({
      where: { id },
      data: {
        ...(data.projectId !== undefined ? { projectId: data.projectId } : {}),
        ...(data.customerName !== undefined ? { customerName: data.customerName } : {}),
        ...(data.customerRequest !== undefined ? { customerRequest: data.customerRequest } : {}),
        ...(data.quotationDate !== undefined ? { quotationDate: data.quotationDate } : {}),
        ...(data.vatEnabled !== undefined ? { vatEnabled: data.vatEnabled } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.signatureImageUrl !== undefined ? { signatureImageUrl: data.signatureImageUrl } : {}),
        updatedById: context.actorId,
        ...totals,
        ...(data.items ? { items: { create: nextItems } } : {})
      },
      include: quotationInclude
    });
  });

  await createAuditLog({
    actorId: context.actorId,
    action: "update",
    module: "quotations",
    targetType: "quotation",
    targetId: id,
    oldValue: existing,
    newValue: quotation,
    metadata: { quotationCode: quotation.quotationCode, itemCount: quotation.items.length, grandTotal: quotation.grandTotal },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return quotation;
}

export async function deleteQuotation(id: string, context: RequestContext) {
  const existing = await getQuotation(id);
  const quotation = await prisma.quotation.update({
    where: { id },
    data: { status: "cancelled", deletedAt: new Date(), updatedById: context.actorId },
    include: quotationInclude
  });

  await createAuditLog({
    actorId: context.actorId,
    action: "delete",
    module: "quotations",
    targetType: "quotation",
    targetId: id,
    oldValue: existing,
    newValue: quotation,
    metadata: { quotationCode: quotation.quotationCode },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return quotation;
}

export async function addQuotationImage(
  id: string,
  file: { originalname: string; filename: string; path: string; size: number; mimetype: string },
  context: RequestContext
) {
  const quotation = await getQuotation(id);
  const image = await prisma.quotationImage.create({
    data: {
      quotationId: id,
      fileName: file.originalname,
      fileUrl: `/uploads/quotations/${file.filename}`,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedById: context.actorId
    }
  });

  await createAuditLog({
    actorId: context.actorId,
    action: "upload_image",
    module: "quotations",
    targetType: "quotation",
    targetId: id,
    newValue: image,
    metadata: { quotationCode: quotation.quotationCode, fileName: image.fileName },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return image;
}

export async function deleteQuotationImage(id: string, context: RequestContext) {
  const image = await prisma.quotationImage.findUnique({ where: { id }, include: { quotation: true } });
  if (!image) throw new AppError(404, "Quotation image not found.");
  await prisma.quotationImage.delete({ where: { id } });

  await createAuditLog({
    actorId: context.actorId,
    action: "delete_image",
    module: "quotations",
    targetType: "quotation_image",
    targetId: id,
    oldValue: image,
    metadata: { quotationId: image.quotationId, quotationCode: image.quotation.quotationCode, fileName: image.fileName },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return image;
}

export async function updateQuotationSignature(
  id: string,
  file: { originalname: string; filename: string; path: string; size: number; mimetype: string },
  context: RequestContext
) {
  const existing = await getQuotation(id);
  const signatureImageUrl = `/uploads/quotations/${file.filename}`;
  const quotation = await prisma.quotation.update({
    where: { id },
    data: { signatureImageUrl, updatedById: context.actorId },
    include: quotationInclude
  });

  await createAuditLog({
    actorId: context.actorId,
    action: "upload_signature",
    module: "quotations",
    targetType: "quotation",
    targetId: id,
    oldValue: { signatureImageUrl: existing.signatureImageUrl },
    newValue: { signatureImageUrl },
    metadata: { quotationCode: quotation.quotationCode, fileName: file.originalname },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return quotation;
}

function setMoneyCell(cell: ExcelJS.Cell, value: Prisma.Decimal | number | string) {
  cell.value = Number(value);
  cell.numFmt = '#,##0';
}

export async function exportQuotationExcel(id: string, context: RequestContext) {
  const quotation = await getQuotation(id);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TeamPlatform";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Quotation");

  sheet.columns = [
    { key: "a", width: 20 },
    { key: "b", width: 26 },
    { key: "c", width: 18 },
    { key: "d", width: 34 },
    { key: "e", width: 14 },
    { key: "f", width: 14 },
    { key: "g", width: 18 },
    { key: "h", width: 18 }
  ];

  sheet.mergeCells("A1:H1");
  sheet.getCell("A1").value = "Quotation";
  sheet.getCell("A1").font = { bold: true, size: 18 };
  sheet.addRow([]);
  sheet.addRow(["Quotation Code", quotation.quotationCode, "Quotation Date", quotation.quotationDate]);
  sheet.addRow(["Project", quotation.project ? `${quotation.project.projectCode} - ${quotation.project.name}` : "-", "Customer", quotation.customerName]);
  sheet.addRow(["Customer Request", quotation.customerRequest ?? "-"]);
  sheet.addRow([]);

  const headerRow = sheet.addRow(["#", "Material Code", "Material Name", "Quantity", "Unit", "Unit Price VND", "Amount VND"]);
  headerRow.font = { bold: true };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };

  quotation.items.forEach((item) => {
    const row = sheet.addRow([
      item.lineIndex,
      item.materialCodeSnapshot,
      item.materialNameSnapshot,
      Number(item.quantity),
      item.unitSnapshot,
      Number(item.unitPrice),
      Number(item.amount)
    ]);
    row.getCell(4).numFmt = '#,##0.###';
    row.getCell(6).numFmt = '#,##0';
    row.getCell(7).numFmt = '#,##0';
  });

  sheet.addRow([]);
  const totals = [
    ["Subtotal for 1 Set", quotation.subtotalOneSet],
    ["Number of Sets", quotation.numberOfSets],
    ["Total Before VAT", quotation.totalBeforeVat],
    ["VAT Enabled", quotation.vatEnabled ? "Yes" : "No"],
    ["VAT Rate %", quotation.vatRate],
    ["VAT Amount", quotation.vatAmount],
    ["Grand Total", quotation.grandTotal]
  ] as const;
  for (const [label, value] of totals) {
    const row = sheet.addRow([label, value]);
    row.getCell(1).font = { bold: true };
    if (value instanceof Prisma.Decimal) setMoneyCell(row.getCell(2), value);
  }

  if (quotation.images.length > 0 || quotation.signatureImageUrl) {
    sheet.addRow([]);
    sheet.addRow(["Images"]);
    quotation.images.forEach((image) => sheet.addRow([image.fileName, image.fileUrl]));
    if (quotation.signatureImageUrl) sheet.addRow(["Signature", quotation.signatureImageUrl]);
  }

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const fileName = `quotation-${quotation.quotationCode}.xlsx`;

  await prisma.exportLog.create({
    data: {
      exportType: "quotation",
      fileName,
      format: "excel",
      filtersJson: { quotationId: id } as Prisma.InputJsonValue,
      exportedById: context.actorId,
      metadata: { quotationCode: quotation.quotationCode, grandTotal: quotation.grandTotal.toString() }
    }
  });

  await createAuditLog({
    actorId: context.actorId,
    action: "export",
    module: "quotations",
    targetType: "quotation",
    targetId: id,
    metadata: { quotationCode: quotation.quotationCode, fileName },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return { fileName, buffer };
}
