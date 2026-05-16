import { Prisma } from "@prisma/client";
import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../../prisma/client";
import { AppError } from "../../utils/app-error";
import { createAuditLog } from "../audit/audit.service";
import { getPagination, getPaginationMeta, handlePrismaError } from "../hr/hr.utils";
import {
  toDecimal,
  money,
  quantity,
  dateCode,
  quotationCodePrefix,
  deriveNextSequence,
  formatQuotationCode,
  calculateTotals
} from "./quotations.calculator.js";
import type { z } from "zod";
import type {
  companySettingsSchema,
  quotationCreateSchema,
  quotationQuerySchema,
  quotationUpdateSchema,
  templateMappingSchema,
  templateVersionCreateSchema,
  templateVersionLayoutSchema,
  templateVersionTableConfigSchema,
  templateQuerySchema,
  templateUpdateSchema
} from "./quotations.schemas";

const db = prisma as any;

type QuotationQuery = z.infer<typeof quotationQuerySchema>;
type TemplateQuery = z.infer<typeof templateQuerySchema>;
type QuotationCreate = z.infer<typeof quotationCreateSchema>;
type QuotationUpdate = z.infer<typeof quotationUpdateSchema>;
type QuotationItemInput = QuotationCreate["items"][number];
type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
type TemplateUpdateInput = z.infer<typeof templateUpdateSchema>;
type TemplateMappingInput = z.infer<typeof templateMappingSchema>;
type TemplateVersionCreateInput = z.infer<typeof templateVersionCreateSchema>;
type TemplateVersionLayoutInput = z.infer<typeof templateVersionLayoutSchema>;
type TemplateVersionTableConfigInput = z.infer<typeof templateVersionTableConfigSchema>;

interface RequestContext {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
}

const defaultPlaceholderConfig = {
  "#yyyyMMdd": "quotationDate",
  "Q-#yyyyMMdd+ID": "quotationCode",
  "#Project": "projectName",
  "#Customer": "customerName",
  "#Spect": "customerRequest",
  "#Content": "content",
  "#Name": "item.materialNameSnapshot",
  "#Model": "item.modelSnapshot",
  "#Qty": "item.quantity",
  "#Unit": "item.unitSnapshot",
  "#Price": "item.unitPrice",
  "#PriceTotal": "item.amount"
};

const defaultCanvasConfig = {
  pageWidth: 794,
  pageHeight: 1123,
  unit: "px",
  backgroundColor: "#ffffff"
};

const defaultTableConfig = {
  columns: [
    { key: "lineIndex", label: "No", width: 48, visible: true, align: "center" },
    { key: "materialCodeSnapshot", label: "Material Code", width: 120, visible: true, align: "left" },
    { key: "materialNameSnapshot", label: "Item Description", width: 220, visible: true, align: "left" },
    { key: "modelSnapshot", label: "Model", width: 120, visible: true, align: "left" },
    { key: "pictureUrlSnapshot", label: "Picture", width: 90, visible: true, align: "center" },
    { key: "quantity", label: "Quantity", width: 90, visible: true, align: "right" },
    { key: "unitSnapshot", label: "Unit", width: 70, visible: true, align: "center" },
    { key: "unitPrice", label: "Unit Price", width: 120, visible: true, align: "right" },
    { key: "amount", label: "Amount", width: 120, visible: true, align: "right" }
  ]
};

const defaultLayoutConfig = {
  blocks: [
    { id: "company-info", blockType: "company_info", x: 40, y: 32, width: 360, height: 92, zIndex: 1, visible: true, locked: false, content: "Company Information", bindingKey: "company.name", styleConfig: { fontSize: 18, fontWeight: "700", textAlign: "left", textColor: "#111827", backgroundColor: "#ffffff", border: false, padding: 8 }, required: true },
    { id: "quotation-title", blockType: "text", x: 250, y: 130, width: 300, height: 48, zIndex: 2, visible: true, locked: false, content: "QUOTATION", bindingKey: "", styleConfig: { fontSize: 24, fontWeight: "700", textAlign: "center", textColor: "#111827", backgroundColor: "#ffffff", border: false, padding: 8 }, required: true },
    { id: "quotation-info", blockType: "quotation_info", x: 430, y: 32, width: 300, height: 92, zIndex: 1, visible: true, locked: false, content: "Quotation Information", bindingKey: "quotation.code", styleConfig: { fontSize: 12, fontWeight: "500", textAlign: "left", textColor: "#111827", backgroundColor: "#ffffff", border: true, padding: 8 }, required: true },
    { id: "customer-info", blockType: "customer_info", x: 40, y: 190, width: 690, height: 86, zIndex: 1, visible: true, locked: false, content: "Customer Information", bindingKey: "customer.name", styleConfig: { fontSize: 13, fontWeight: "500", textAlign: "left", textColor: "#111827", backgroundColor: "#f9fafb", border: true, padding: 10 }, required: true },
    { id: "material-table", blockType: "material_table", x: 40, y: 300, width: 690, height: 360, zIndex: 1, visible: true, locked: false, content: "Material Table", bindingKey: "quotation.items", styleConfig: { fontSize: 12, fontWeight: "400", textAlign: "left", textColor: "#111827", backgroundColor: "#ffffff", border: true, padding: 6 }, required: true },
    { id: "totals", blockType: "totals", x: 430, y: 690, width: 300, height: 130, zIndex: 1, visible: true, locked: false, content: "Totals", bindingKey: "grandTotal", styleConfig: { fontSize: 13, fontWeight: "600", textAlign: "right", textColor: "#111827", backgroundColor: "#ffffff", border: true, padding: 8 }, required: true },
    { id: "notes", blockType: "notes", x: 40, y: 850, width: 360, height: 120, zIndex: 1, visible: true, locked: false, content: "Notes", bindingKey: "notes", styleConfig: { fontSize: 12, fontWeight: "400", textAlign: "left", textColor: "#374151", backgroundColor: "#ffffff", border: false, padding: 8 }, required: false },
    { id: "signature", blockType: "signature", x: 500, y: 850, width: 230, height: 120, zIndex: 1, visible: true, locked: false, content: "Signature", bindingKey: "signature.image", styleConfig: { fontSize: 12, fontWeight: "500", textAlign: "center", textColor: "#111827", backgroundColor: "#ffffff", border: false, padding: 8 }, required: false }
  ]
};

function toUploadUrl(fileName: string) {
  return `/uploads/quotations/${fileName}`;
}

function diskPathFromUploadUrl(fileUrl: string) {
  return path.resolve(process.cwd(), "uploads", fileUrl.replace(/^\/uploads\//, ""));
}

async function generateQuotationCode(quotationDate: Date) {
  const prefix = quotationCodePrefix(quotationDate);
  const existing = await db.quotation.findMany({
    where: { quotationCode: { startsWith: prefix } },
    select: { quotationCode: true }
  });
  const sequence = deriveNextSequence(prefix, existing.map((q: { quotationCode: string }) => q.quotationCode));
  return formatQuotationCode(prefix, sequence);
}

export async function previewNextQuotationCode(date = new Date()) {
  return { quotationCode: await generateQuotationCode(date) };
}

function quotationWhere(query: QuotationQuery) {
  return {
    deletedAt: null,
    ...(query.projectId ? { projectId: query.projectId } : {}),
    ...(query.quotationType ? { quotationType: query.quotationType } : {}),
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
      ? { quotationDate: { ...(query.dateFrom ? { gte: query.dateFrom } : {}), ...(query.dateTo ? { lte: query.dateTo } : {}) } }
      : {})
  };
}

const quotationInclude = {
  project: { select: { id: true, projectCode: true, name: true, customerName: true } },
  currentVersion: { include: { items: { orderBy: { lineIndex: "asc" } } } },
  images: { orderBy: { createdAt: "asc" } }
};

function normalizeQuotation(quotation: any) {
  return {
    ...quotation,
    items: quotation.currentVersion?.items ?? quotation.items ?? [],
    versions: quotation.versions
  };
}

export async function listQuotations(query: QuotationQuery) {
  const where = quotationWhere(query);
  const pagination = getPagination(query);
  const [total, items] = await Promise.all([
    db.quotation.count({ where }),
    db.quotation.findMany({
      where,
      include: { project: quotationInclude.project, currentVersion: { select: { id: true, versionNumber: true, status: true } } },
      orderBy: [{ quotationDate: "desc" }, { createdAt: "desc" }],
      ...pagination
    })
  ]);
  return { items, meta: getPaginationMeta(query, total) };
}

export async function getQuotation(id: string) {
  const quotation = await db.quotation.findFirst({ where: { id, deletedAt: null }, include: quotationInclude });
  if (!quotation) throw new AppError(404, "Quotation not found.");
  return normalizeQuotation(quotation);
}

export async function listQuotationVersions(id: string) {
  await getQuotation(id);
  return db.quotationVersion.findMany({
    where: { quotationId: id },
    include: { items: { orderBy: { lineIndex: "asc" } } },
    orderBy: { versionNumber: "desc" }
  });
}

export async function getQuotationVersion(id: string, versionId: string) {
  const version = await db.quotationVersion.findFirst({
    where: { id: versionId, quotationId: id },
    include: { items: { orderBy: { lineIndex: "asc" } }, quotation: { include: { project: quotationInclude.project } } }
  });
  if (!version) throw new AppError(404, "Quotation version not found.");
  return version;
}

async function ensureProject(data: { quotationType?: string; projectId?: string }) {
  if (data.quotationType === "project" && !data.projectId) throw new AppError(400, "Project is required for Project Quotation.");
  if (!data.projectId) return;
  const project = await db.project.findFirst({ where: { id: data.projectId, deletedAt: null }, select: { id: true } });
  if (!project) throw new AppError(400, "Project does not exist.");
}

async function buildQuotationItems(items: QuotationItemInput[]) {
  const materialIds = Array.from(new Set(items.map((item) => item.materialId)));
  const materials = await db.inventoryItem.findMany({
    where: { id: { in: materialIds }, deletedAt: null },
    select: { id: true, materialCode: true, materialName: true, model: true, imageUrl: true, unit: true, sellingPrice: true }
  });
  const materialById = new Map(materials.map((material: any) => [material.id, material]));

  return items.map((item, index) => {
    const material = materialById.get(item.materialId) as any;
    if (!material) throw new AppError(400, "Material does not exist.");
    const itemQuantity = quantity(toDecimal(item.quantity));
    const unitPrice = money(toDecimal(item.unitPrice ?? material.sellingPrice));
    const amount = money(itemQuantity.mul(unitPrice));
    return {
      lineIndex: index + 1,
      materialId: material.id,
      materialCodeSnapshot: material.materialCode,
      materialNameSnapshot: material.materialName,
      modelSnapshot: material.model,
      pictureUrlSnapshot: material.imageUrl,
      unitSnapshot: material.unit,
      quantity: itemQuantity,
      unitPrice,
      amount
    };
  });
}

async function createVersion(tx: any, quotationId: string, versionNumber: number, data: QuotationCreate | QuotationUpdate, items: any[], totals: any, context: RequestContext) {
  return tx.quotationVersion.create({
    data: {
      quotationId,
      versionNumber,
      quotationType: data.quotationType ?? "commercial",
      projectId: data.projectId,
      customerName: data.customerName,
      customerRequest: data.customerRequest,
      content: data.content,
      quotationDate: data.quotationDate,
      vatEnabled: data.vatEnabled ?? false,
      status: data.status ?? "draft",
      createdById: context.actorId,
      ...totals,
      items: { create: items }
    },
    include: { items: { orderBy: { lineIndex: "asc" } } }
  });
}

async function createWithCode(data: QuotationCreate, context: RequestContext) {
  await ensureProject(data);
  const quotationCode = await generateQuotationCode(data.quotationDate);
  const items = await buildQuotationItems(data.items);
  const totals = calculateTotals(items, data.numberOfSets, data.vatEnabled, data.vatRate);

  const quotation = await db.$transaction(async (tx: any) => {
    const master = await tx.quotation.create({
      data: {
        quotationCode,
        quotationType: data.quotationType,
        projectId: data.projectId,
        customerName: data.customerName,
        customerRequest: data.customerRequest,
        content: data.content,
        quotationDate: data.quotationDate,
        vatEnabled: data.vatEnabled,
        status: data.status,
        signatureImageUrl: data.signatureImageUrl,
        createdById: context.actorId,
        updatedById: context.actorId,
        ...totals,
        items: {
          create: items.map(({ modelSnapshot: _model, pictureUrlSnapshot: _picture, ...item }) => item)
        }
      }
    });
    const version = await createVersion(tx, master.id, 1, data, items, totals, context);
    return tx.quotation.update({
      where: { id: master.id },
      data: { currentVersionId: version.id },
      include: quotationInclude
    });
  });

  await createAuditLog({
    actorId: context.actorId,
    action: "create",
    module: "quotations",
    targetType: "quotation",
    targetId: quotation.id,
    newValue: quotation,
    metadata: { quotationCode, versionNumber: 1, itemCount: quotation.currentVersion?.items.length, grandTotal: quotation.grandTotal },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return normalizeQuotation(quotation);
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

function dataFromExisting(existing: any, data: QuotationUpdate): QuotationCreate {
  const base = existing.currentVersion ?? existing;
  return {
    quotationType: data.quotationType ?? base.quotationType,
    projectId: data.projectId !== undefined ? data.projectId : base.projectId,
    customerName: data.customerName ?? base.customerName,
    customerRequest: data.customerRequest !== undefined ? data.customerRequest : base.customerRequest,
    content: data.content !== undefined ? data.content : base.content,
    quotationDate: data.quotationDate ?? base.quotationDate,
    numberOfSets: data.numberOfSets ?? Number(base.numberOfSets),
    vatEnabled: data.vatEnabled ?? base.vatEnabled,
    vatRate: data.vatRate ?? Number(base.vatRate),
    status: data.status ?? "draft",
    signatureImageUrl: data.signatureImageUrl ?? existing.signatureImageUrl,
    items: data.items ?? base.items.map((item: any) => ({ materialId: item.materialId, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice) }))
  };
}

export async function updateQuotation(id: string, data: QuotationUpdate, context: RequestContext) {
  const existing = await getQuotation(id);
  const nextData = dataFromExisting(existing, data);
  await ensureProject(nextData);
  const items = await buildQuotationItems(nextData.items);
  const totals = calculateTotals(items, nextData.numberOfSets, nextData.vatEnabled, nextData.vatRate);
  const nextVersionNumber = (existing.currentVersion?.versionNumber ?? 0) + 1;

  const quotation = await db.$transaction(async (tx: any) => {
    await tx.quotationItem.deleteMany({ where: { quotationId: id } });
    const version = await createVersion(tx, id, nextVersionNumber, nextData, items, totals, context);
    return tx.quotation.update({
      where: { id },
      data: {
        quotationType: nextData.quotationType,
        projectId: nextData.projectId,
        customerName: nextData.customerName,
        customerRequest: nextData.customerRequest,
        content: nextData.content,
        quotationDate: nextData.quotationDate,
        vatEnabled: nextData.vatEnabled,
        status: nextData.status,
        signatureImageUrl: nextData.signatureImageUrl,
        updatedById: context.actorId,
        currentVersionId: version.id,
        ...totals,
        items: { create: items.map(({ modelSnapshot: _model, pictureUrlSnapshot: _picture, ...item }) => item) }
      },
      include: quotationInclude
    });
  });

  await createAuditLog({
    actorId: context.actorId,
    action: "create_version",
    module: "quotations",
    targetType: "quotation",
    targetId: id,
    oldValue: existing,
    newValue: quotation,
    metadata: { quotationCode: quotation.quotationCode, versionNumber: nextVersionNumber, grandTotal: quotation.grandTotal },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return normalizeQuotation(quotation);
}

export async function createUpdateFromVersion(id: string, versionId: string, data: QuotationUpdate, context: RequestContext) {
  const version = await getQuotationVersion(id, versionId);
  const payload = {
    quotationType: data.quotationType ?? version.quotationType,
    projectId: data.projectId !== undefined ? data.projectId : version.projectId,
    customerName: data.customerName ?? version.customerName,
    customerRequest: data.customerRequest !== undefined ? data.customerRequest : version.customerRequest,
    content: data.content !== undefined ? data.content : version.content,
    quotationDate: data.quotationDate ?? version.quotationDate,
    numberOfSets: data.numberOfSets ?? Number(version.numberOfSets),
    vatEnabled: data.vatEnabled ?? version.vatEnabled,
    vatRate: data.vatRate ?? Number(version.vatRate),
    status: data.status ?? "draft",
    items: data.items ?? version.items.map((item: any) => ({ materialId: item.materialId, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice) }))
  };
  return updateQuotation(id, payload, context);
}

export async function deleteQuotation(id: string, context: RequestContext) {
  const existing = await getQuotation(id);
  const quotation = await db.quotation.update({
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

  return normalizeQuotation(quotation);
}

export async function addQuotationImage(id: string, file: { originalname: string; filename: string; size: number; mimetype: string }, context: RequestContext) {
  const quotation = await getQuotation(id);
  const image = await db.quotationImage.create({
    data: { quotationId: id, fileName: file.originalname, fileUrl: toUploadUrl(file.filename), fileSize: file.size, mimeType: file.mimetype, uploadedById: context.actorId }
  });
  await createAuditLog({ actorId: context.actorId, action: "upload_image", module: "quotations", targetType: "quotation", targetId: id, newValue: image, metadata: { quotationCode: quotation.quotationCode }, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return image;
}

export async function deleteQuotationImage(id: string, context: RequestContext) {
  const image = await db.quotationImage.findUnique({ where: { id }, include: { quotation: true } });
  if (!image) throw new AppError(404, "Quotation image not found.");
  await db.quotationImage.delete({ where: { id } });
  await createAuditLog({ actorId: context.actorId, action: "delete_image", module: "quotations", targetType: "quotation_image", targetId: id, oldValue: image, metadata: { quotationId: image.quotationId, quotationCode: image.quotation.quotationCode }, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return image;
}

export async function updateQuotationSignature(id: string, file: { originalname: string; filename: string; size: number; mimetype: string }, context: RequestContext) {
  const existing = await getQuotation(id);
  const signatureImageUrl = toUploadUrl(file.filename);
  const quotation = await db.quotation.update({ where: { id }, data: { signatureImageUrl, updatedById: context.actorId }, include: quotationInclude });
  await createAuditLog({ actorId: context.actorId, action: "upload_signature", module: "quotations", targetType: "quotation", targetId: id, oldValue: { signatureImageUrl: existing.signatureImageUrl }, newValue: { signatureImageUrl }, metadata: { quotationCode: quotation.quotationCode }, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return normalizeQuotation(quotation);
}

export async function uploadCustomerPo(id: string, versionId: string, file: { originalname: string; filename: string; size: number; mimetype: string }, context: RequestContext) {
  const version = await getQuotationVersion(id, versionId);
  const updated = await db.quotationVersion.update({
    where: { id: versionId },
    data: { customerPoFileName: file.originalname, customerPoFileUrl: toUploadUrl(file.filename) },
    include: { items: { orderBy: { lineIndex: "asc" } } }
  });
  await createAuditLog({ actorId: context.actorId, action: "upload_customer_po", module: "quotations", targetType: "quotation_version", targetId: versionId, oldValue: version, newValue: updated, metadata: { quotationId: id }, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return updated;
}

async function updateVersionStatus(id: string, versionId: string, status: string, context: RequestContext) {
  await getQuotationVersion(id, versionId);
  const version = await db.quotationVersion.update({
    where: { id: versionId },
    data: { status, ...(status === "approved" ? { approvedAt: new Date(), approvedById: context.actorId } : {}) },
    include: { items: { orderBy: { lineIndex: "asc" } } }
  });
  const quotation = await db.quotation.findUnique({ where: { id }, select: { currentVersionId: true } });
  if (quotation?.currentVersionId === versionId) await db.quotation.update({ where: { id }, data: { status } });
  await createAuditLog({ actorId: context.actorId, action: status, module: "quotations", targetType: "quotation_version", targetId: versionId, newValue: version, metadata: { quotationId: id, versionNumber: version.versionNumber }, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return version;
}

export const approveQuotationVersion = (id: string, versionId: string, context: RequestContext) => updateVersionStatus(id, versionId, "approved", context);
export const rejectQuotationVersion = (id: string, versionId: string, context: RequestContext) => updateVersionStatus(id, versionId, "rejected", context);
export const cancelQuotationVersion = (id: string, versionId: string, context: RequestContext) => updateVersionStatus(id, versionId, "cancelled", context);

export async function createStockOutFromVersion(id: string, versionId: string, context: RequestContext) {
  const version = await getQuotationVersion(id, versionId);
  if (version.status !== "approved") throw new AppError(400, "Only approved quotation versions can create Stock Out.");
  if (version.stockOutCreatedAt) throw new AppError(400, "Stock Out was already created for this quotation version.");

  const transactions = await db.$transaction(async (tx: any) => {
    const created = [];
    for (const item of version.items) {
      if (!item.materialId) throw new AppError(400, `Material is missing for ${item.materialNameSnapshot}.`);
      const requiredQuantity = quantity(toDecimal(item.quantity).mul(version.numberOfSets));
      const inventoryItem = await tx.inventoryItem.findUnique({ where: { id: item.materialId } });
      if (!inventoryItem) throw new AppError(404, "Material not found.");
      const currentStock = toDecimal(inventoryItem.stockQuantity);
      if (currentStock.lt(requiredQuantity)) throw new AppError(400, "Insufficient stock quantity.");
      const resultingStock = quantity(currentStock.sub(requiredQuantity));
      await tx.inventoryItem.update({ where: { id: item.materialId }, data: { stockQuantity: resultingStock, updatedById: context.actorId } });
      created.push(await tx.inventoryStockMovement.create({
        data: {
          itemId: item.materialId,
          movementType: "issue",
          quantity: requiredQuantity,
          previousStock: currentStock,
          resultingStock,
          referenceType: "quotation",
          referenceId: versionId,
          projectId: version.projectId,
          note: `Stock Out from quotation ${version.quotation.quotationCode} v${version.versionNumber}`,
          metadata: { quotationId: id, quotationVersionId: versionId, customerPoFileUrl: version.customerPoFileUrl },
          createdById: context.actorId
        }
      }));
    }
    await tx.quotationVersion.update({ where: { id: versionId }, data: { stockOutCreatedAt: new Date(), stockOutCreatedById: context.actorId } });
    return created;
  });

  await createAuditLog({ actorId: context.actorId, action: "stock_out", module: "quotations", targetType: "quotation_version", targetId: versionId, metadata: { quotationId: id, movementCount: transactions.length }, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return { transactions };
}

export async function syncProjectMaterials(id: string, versionId: string, context: RequestContext) {
  const version = await getQuotationVersion(id, versionId);
  if (version.quotationType !== "project" || !version.projectId) throw new AppError(400, "Only Project Quotations can sync to Project Materials.");
  const results = await db.$transaction(async (tx: any) => {
    const synced = [];
    for (const item of version.items) {
      const plannedQuantity = quantity(toDecimal(item.quantity).mul(version.numberOfSets));
      const existing = await tx.projectMaterial.findUnique({
        where: { projectId_materialCode: { projectId: version.projectId, materialCode: item.materialCodeSnapshot } }
      });
      if (existing) {
        synced.push(await tx.projectMaterial.update({
          where: { id: existing.id },
          data: { quotationId: id, quotationVersionId: versionId, plannedQuantity, remainingQuantity: plannedQuantity, estimatedUnitPrice: item.unitPrice }
        }));
      } else {
        synced.push(await tx.projectMaterial.create({
          data: {
            projectId: version.projectId,
            quotationId: id,
            quotationVersionId: versionId,
            materialCode: item.materialCodeSnapshot,
            materialName: item.materialNameSnapshot,
            unit: item.unitSnapshot,
            plannedQuantity,
            remainingQuantity: plannedQuantity,
            estimatedUnitPrice: item.unitPrice,
            status: "not_ordered"
          }
        }));
      }
    }
    await tx.quotationVersion.update({ where: { id: versionId }, data: { projectSyncedAt: new Date(), projectSyncedById: context.actorId } });
    return synced;
  });
  await createAuditLog({ actorId: context.actorId, action: "sync_project_materials", module: "quotations", targetType: "quotation_version", targetId: versionId, metadata: { quotationId: id, itemCount: results.length }, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return { items: results };
}

export async function getCompanySettings() {
  const existing = await db.quotationCompanySettings.findFirst({ orderBy: { createdAt: "asc" } });
  return existing ?? db.quotationCompanySettings.create({ data: {} });
}

export async function updateCompanySettings(data: CompanySettingsInput, context: RequestContext) {
  const existing = await getCompanySettings();
  const updated = await db.quotationCompanySettings.update({ where: { id: existing.id }, data: { ...data, updatedById: context.actorId } });
  await createAuditLog({ actorId: context.actorId, action: "update", module: "quotation_settings", targetType: "quotation_company_settings", targetId: updated.id, oldValue: existing, newValue: updated, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return updated;
}

export async function listQuotationTemplates(query: TemplateQuery) {
  const pagination = getPagination(query);
  const where = { deletedAt: null, ...(query.quotationId ? { quotationId: query.quotationId } : {}) };
  const [total, items] = await Promise.all([
    db.quotationTemplate.count({ where }),
    db.quotationTemplate.findMany({ where, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }], ...pagination })
  ]);
  return { items, meta: getPaginationMeta(query, total) };
}

export async function getQuotationTemplate(id: string) {
  const template = await db.quotationTemplate.findFirst({
    where: { id, deletedAt: null },
    include: { versions: { where: { status: "active" }, orderBy: { versionNumber: "desc" } } }
  });
  if (!template) throw new AppError(404, "Quotation template not found.");
  return template;
}

async function getDefaultTemplateVersion(template: any) {
  if (!template) return null;
  if (template.defaultVersionId) {
    const version = await db.quotationTemplateVersion.findFirst({ where: { id: template.defaultVersionId, status: "active" } });
    if (version) return version;
  }
  return db.quotationTemplateVersion.findFirst({
    where: { templateId: template.id, status: "active" },
    orderBy: { versionNumber: "desc" }
  });
}

async function nextTemplateVersionNumber(templateId: string) {
  const latest = await db.quotationTemplateVersion.findFirst({
    where: { templateId },
    orderBy: { versionNumber: "desc" },
    select: { versionNumber: true }
  });
  return (latest?.versionNumber ?? 0) + 1;
}

async function createInitialTemplateVersion(template: any, context: RequestContext) {
  const version = await db.quotationTemplateVersion.create({
    data: {
      templateId: template.id,
      versionNumber: 1,
      originalFileUrl: template.fileUrl,
      sheetName: "Quotation",
      layoutConfig: defaultLayoutConfig,
      placeholderConfig: template.placeholderConfig ?? defaultPlaceholderConfig,
      tableConfig: defaultTableConfig,
      canvasConfig: defaultCanvasConfig,
      createdById: context.actorId
    }
  });
  await db.quotationTemplate.update({ where: { id: template.id }, data: { defaultVersionId: version.id } });
  return version;
}

export async function listQuotationTemplateVersions(templateId: string) {
  await getQuotationTemplate(templateId);
  return db.quotationTemplateVersion.findMany({
    where: { templateId, status: "active" },
    orderBy: { versionNumber: "desc" }
  });
}

export async function getQuotationTemplateVersion(id: string) {
  const version = await db.quotationTemplateVersion.findFirst({
    where: { id, status: "active" },
    include: { template: true }
  });
  if (!version) throw new AppError(404, "Quotation template version not found.");
  return version;
}

export async function createQuotationTemplateVersion(templateId: string, data: TemplateVersionCreateInput, context: RequestContext) {
  const template = await getQuotationTemplate(templateId);
  const source = data.sourceVersionId ? await getQuotationTemplateVersion(data.sourceVersionId) : await getDefaultTemplateVersion(template);
  const version = await db.quotationTemplateVersion.create({
    data: {
      templateId,
      versionNumber: await nextTemplateVersionNumber(templateId),
      originalFileUrl: source?.originalFileUrl ?? template.fileUrl,
      sheetName: data.sheetName ?? source?.sheetName ?? "Quotation",
      layoutConfig: data.layoutConfig ?? source?.layoutConfig ?? defaultLayoutConfig,
      placeholderConfig: data.placeholderConfig ?? source?.placeholderConfig ?? template.placeholderConfig ?? defaultPlaceholderConfig,
      tableConfig: data.tableConfig ?? source?.tableConfig ?? defaultTableConfig,
      canvasConfig: data.canvasConfig ?? source?.canvasConfig ?? defaultCanvasConfig,
      createdById: context.actorId
    }
  });
  await createAuditLog({ actorId: context.actorId, action: "create_version", module: "quotation_templates", targetType: "quotation_template_version", targetId: version.id, metadata: { templateId, versionNumber: version.versionNumber }, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return version;
}

export async function updateQuotationTemplateVersionLayout(id: string, data: TemplateVersionLayoutInput, context: RequestContext) {
  const existing = await getQuotationTemplateVersion(id);
  const updated = await db.quotationTemplateVersion.update({
    where: { id },
    data: {
      layoutConfig: data.layoutConfig,
      canvasConfig: data.canvasConfig ?? existing.canvasConfig
    }
  });
  await createAuditLog({ actorId: context.actorId, action: "layout_edit", module: "quotation_templates", targetType: "quotation_template_version", targetId: id, oldValue: { layoutConfig: existing.layoutConfig, canvasConfig: existing.canvasConfig }, newValue: { layoutConfig: updated.layoutConfig, canvasConfig: updated.canvasConfig }, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return updated;
}

export async function updateQuotationTemplateVersionTableConfig(id: string, data: TemplateVersionTableConfigInput, context: RequestContext) {
  const existing = await getQuotationTemplateVersion(id);
  const updated = await db.quotationTemplateVersion.update({ where: { id }, data: { tableConfig: data.tableConfig } });
  await createAuditLog({ actorId: context.actorId, action: "table_config_update", module: "quotation_templates", targetType: "quotation_template_version", targetId: id, oldValue: { tableConfig: existing.tableConfig }, newValue: { tableConfig: updated.tableConfig }, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return updated;
}

export async function duplicateQuotationTemplateVersion(id: string, context: RequestContext) {
  const source = await getQuotationTemplateVersion(id);
  const version = await createQuotationTemplateVersion(source.templateId, {
    sourceVersionId: source.id,
    sheetName: source.sheetName ?? undefined,
    layoutConfig: source.layoutConfig ?? undefined,
    placeholderConfig: source.placeholderConfig ?? undefined,
    tableConfig: source.tableConfig ?? undefined,
    canvasConfig: source.canvasConfig ?? undefined
  } as TemplateVersionCreateInput, context);
  await createAuditLog({ actorId: context.actorId, action: "duplicate_version", module: "quotation_templates", targetType: "quotation_template_version", targetId: version.id, metadata: { sourceVersionId: id }, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return version;
}

export async function setDefaultQuotationTemplateVersion(templateId: string, versionId: string, context: RequestContext) {
  await getQuotationTemplate(templateId);
  const version = await getQuotationTemplateVersion(versionId);
  if (version.templateId !== templateId) throw new AppError(400, "Template Version does not belong to this template.");
  const template = await db.quotationTemplate.update({ where: { id: templateId }, data: { defaultVersionId: versionId, isDefault: true } });
  await createAuditLog({ actorId: context.actorId, action: "set_default_version", module: "quotation_templates", targetType: "quotation_template", targetId: templateId, metadata: { versionId, versionNumber: version.versionNumber }, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return { template, version };
}

export async function restoreQuotationTemplateVersion(id: string, context: RequestContext) {
  const version = await getQuotationTemplateVersion(id);
  const result = await setDefaultQuotationTemplateVersion(version.templateId, id, context);
  await createAuditLog({ actorId: context.actorId, action: "restore_version", module: "quotation_templates", targetType: "quotation_template_version", targetId: id, metadata: { templateId: version.templateId, versionNumber: version.versionNumber }, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return result;
}

async function detectPlaceholders(filePath: string) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const placeholders = new Set<string>();
  workbook.eachSheet((sheet) => {
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        const text = String(cell.value ?? "");
        const matches = text.match(/Q-#yyyyMMdd\+ID|#[A-Za-z0-9_]+/g);
        matches?.forEach((placeholder) => placeholders.add(placeholder));
      });
    });
  });
  return Array.from(placeholders);
}

export async function uploadQuotationTemplate(file: { originalname: string; filename: string; path: string; size: number; mimetype: string }, context: RequestContext) {
  const placeholders = await detectPlaceholders(file.path).catch(() => []);
  const template = await db.quotationTemplate.create({
    data: {
      name: path.parse(file.originalname).name,
      fileName: file.originalname,
      fileUrl: toUploadUrl(file.filename),
      fileSize: file.size,
      mimeType: file.mimetype,
      placeholderConfig: defaultPlaceholderConfig,
      detectedPlaceholders: placeholders,
      uploadedById: context.actorId
    }
  });
  await createInitialTemplateVersion(template, context);
  await createAuditLog({ actorId: context.actorId, action: "upload", module: "quotation_templates", targetType: "quotation_template", targetId: template.id, newValue: template, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return getQuotationTemplate(template.id);
}

export async function updateQuotationTemplate(id: string, data: TemplateUpdateInput, context: RequestContext) {
  const existing = await getQuotationTemplate(id);
  const updated = await db.quotationTemplate.update({ where: { id }, data });
  await createAuditLog({ actorId: context.actorId, action: "update", module: "quotation_templates", targetType: "quotation_template", targetId: id, oldValue: existing, newValue: updated, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return updated;
}

export async function updateQuotationTemplateMapping(id: string, data: TemplateMappingInput, context: RequestContext) {
  return updateQuotationTemplate(id, { placeholderConfig: data.placeholderConfig } as any, context);
}

export async function setDefaultQuotationTemplate(id: string, context: RequestContext) {
  const template = await getQuotationTemplate(id);
  let version = await getDefaultTemplateVersion(template);
  if (!version) version = await createInitialTemplateVersion(template, context);
  await db.$transaction([db.quotationTemplate.updateMany({ where: { deletedAt: null }, data: { isDefault: false } }), db.quotationTemplate.update({ where: { id }, data: { isDefault: true } })]);
  await createAuditLog({ actorId: context.actorId, action: "set_default", module: "quotation_templates", targetType: "quotation_template", targetId: id, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return getQuotationTemplate(id);
}

export async function deleteQuotationTemplate(id: string, context: RequestContext) {
  const existing = await getQuotationTemplate(id);
  const deleted = await db.quotationTemplate.update({ where: { id }, data: { status: "inactive", deletedAt: new Date(), isDefault: false } });
  await createAuditLog({ actorId: context.actorId, action: "delete", module: "quotation_templates", targetType: "quotation_template", targetId: id, oldValue: existing, newValue: deleted, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return deleted;
}

function valueForPlaceholder(placeholder: string, quotation: any, version: any, item?: any) {
  const projectName = version.quotationType === "project" ? version.quotation.project?.name ?? quotation.project?.name ?? "-" : "Commercial";
  const map: Record<string, unknown> = {
    "#yyyyMMdd": dateCode(version.quotationDate),
    "Q-#yyyyMMdd+ID": quotation.quotationCode,
    "#Project": projectName,
    "#Customer": version.customerName,
    "#Spect": version.customerRequest ?? "",
    "#Content": version.content ?? "",
    "#Name": item?.materialNameSnapshot ?? "",
    "#Model": item?.modelSnapshot ?? "",
    "#Qty": item?.quantity?.toString?.() ?? "",
    "#Unit": item?.unitSnapshot ?? "",
    "#Price": item?.unitPrice?.toString?.() ?? "",
    "#PriceTotal": item?.amount?.toString?.() ?? ""
  };
  return map[placeholder] ?? "";
}

function replacePlaceholders(text: string, quotation: any, version: any, item?: any) {
  return text.replace(/Q-#yyyyMMdd\+ID|#[A-Za-z0-9_]+/g, (placeholder) => String(valueForPlaceholder(placeholder, quotation, version, item)));
}

export async function buildQuotationPreview(id: string, versionId?: string) {
  const quotation = await getQuotation(id);
  const version = versionId ? await getQuotationVersion(id, versionId) : quotation.currentVersion;
  const settings = await getCompanySettings();
  const defaultTemplate = await db.quotationTemplate.findFirst({ where: { deletedAt: null, isDefault: true }, orderBy: { createdAt: "desc" } });
  const templateVersion = defaultTemplate ? await getDefaultTemplateVersion(defaultTemplate) : null;
  if (!version) throw new AppError(404, "Quotation version not found.");
  return {
    company: settings,
    companySettings: settings,
    quotation,
    version,
    template: defaultTemplate,
    templateVersion,
    layoutConfig: templateVersion?.layoutConfig ?? null,
    tableConfig: templateVersion?.tableConfig ?? null,
    canvasConfig: templateVersion?.canvasConfig ?? null,
    projectName: version.quotationType === "project" ? quotation.project?.name ?? "-" : "Commercial",
    totals: {
      subtotalOneSet: version.subtotalOneSet,
      totalBeforeVat: version.totalBeforeVat,
      vatAmount: version.vatAmount,
      grandTotal: version.grandTotal
    }
  };
}

function styleWorksheet(sheet: ExcelJS.Worksheet) {
  sheet.columns = [
    { width: 8 },
    { width: 18 },
    { width: 34 },
    { width: 18 },
    { width: 12 },
    { width: 12 },
    { width: 18 },
    { width: 18 }
  ];
}

async function buildDefaultWorkbook(quotation: any, version: any, templateVersion?: any) {
  const settings = await getCompanySettings();
  const tableConfig = templateVersion?.tableConfig ?? defaultTableConfig;
  const columns = Array.isArray(tableConfig?.columns) ? tableConfig.columns.filter((column: any) => column.visible !== false) : defaultTableConfig.columns;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Quotation");
  sheet.columns = columns.map((column: any) => ({ width: Math.max(8, Math.round(Number(column.width ?? 100) / 8)) }));
  sheet.mergeCells("A1:H1");
  sheet.getCell("A1").value = settings.companyName ?? "TeamPlatform";
  sheet.getCell("A1").font = { bold: true, size: 16 };
  sheet.addRow(["Tax Code", settings.taxCode ?? "", "Phone", settings.phone ?? "", "Email", settings.email ?? ""]);
  sheet.addRow(["Address", settings.address ?? ""]);
  sheet.addRow([]);
  sheet.addRow(["Quotation Code", quotation.quotationCode, "Date", version.quotationDate]);
  sheet.addRow(["Project", version.quotationType === "project" ? quotation.project?.name ?? "-" : "Commercial", "Customer", version.customerName]);
  sheet.addRow(["Specifications", version.customerRequest ?? ""]);
  sheet.addRow(["Content", version.content ?? ""]);
  sheet.addRow([]);
  const header = sheet.addRow(columns.map((column: any) => column.label ?? column.key));
  header.font = { bold: true };
  version.items.forEach((item: any) => sheet.addRow(columns.map((column: any) => valueForTableColumn(column.key, item))));
  sheet.addRow([]);
  sheet.addRow(["Subtotal for 1 Set", Number(version.subtotalOneSet)]);
  sheet.addRow(["Number of Sets", Number(version.numberOfSets)]);
  sheet.addRow(["Total Before VAT", Number(version.totalBeforeVat)]);
  sheet.addRow(["VAT", version.vatEnabled ? `${version.vatRate}%` : "No VAT"]);
  sheet.addRow(["VAT Amount", Number(version.vatAmount)]);
  sheet.addRow(["Grand Total", Number(version.grandTotal)]);
  return workbook;
}

function valueForTableColumn(key: string, item: any) {
  const map: Record<string, unknown> = {
    lineIndex: item.lineIndex,
    materialCodeSnapshot: item.materialCodeSnapshot,
    materialNameSnapshot: item.materialNameSnapshot,
    modelSnapshot: item.modelSnapshot ?? "",
    pictureUrlSnapshot: item.pictureUrlSnapshot ?? "",
    quantity: Number(item.quantity),
    unitSnapshot: item.unitSnapshot,
    unitPrice: Number(item.unitPrice),
    amount: Number(item.amount),
    brand: "",
    origin: "",
    leadTime: "",
    warranty: "",
    remark: ""
  };
  return map[key] ?? "";
}

async function buildTemplateWorkbook(quotation: any, version: any, template: any) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(diskPathFromUploadUrl(template.fileUrl));
  workbook.eachSheet((sheet) => {
    let itemTemplateRowNumber = 0;
    sheet.eachRow((row, rowNumber) => {
      const rowText = row.values?.toString?.() ?? "";
      if (!itemTemplateRowNumber && /#Name|#Model|#Qty|#Unit|#Price|#PriceTotal/.test(rowText)) itemTemplateRowNumber = rowNumber;
      row.eachCell((cell) => {
        if (typeof cell.value === "string") cell.value = replacePlaceholders(cell.value, quotation, version);
      });
    });
    if (itemTemplateRowNumber) {
      const templateRow = sheet.getRow(itemTemplateRowNumber);
      version.items.forEach((item: any, index: number) => {
        const row = index === 0 ? templateRow : sheet.insertRow(itemTemplateRowNumber + index, []);
        templateRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const target = row.getCell(colNumber);
          target.style = { ...cell.style };
          target.value = typeof cell.value === "string" ? replacePlaceholders(cell.value, quotation, version, item) : cell.value;
        });
      });
    }
  });
  return workbook;
}

export async function exportQuotationExcel(id: string, context: RequestContext, versionId?: string) {
  const quotation = await getQuotation(id);
  const version = versionId ? await getQuotationVersion(id, versionId) : quotation.currentVersion;
  if (!version) throw new AppError(404, "Quotation version not found.");
  const template = await db.quotationTemplate.findFirst({ where: { deletedAt: null, isDefault: true }, orderBy: { createdAt: "desc" } });
  const templateVersion = template ? await getDefaultTemplateVersion(template) : null;
  const workbook = template ? await buildTemplateWorkbook(quotation, version, template).catch(() => buildDefaultWorkbook(quotation, version, templateVersion)) : await buildDefaultWorkbook(quotation, version, templateVersion);
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const fileName = `quotation-${quotation.quotationCode}.xlsx`;

  await db.exportLog.create({ data: { exportType: "quotation", fileName, format: "excel", filtersJson: { quotationId: id, quotationVersionId: version.id }, exportedById: context.actorId, metadata: { quotationCode: quotation.quotationCode, versionNumber: version.versionNumber } } });
  await createAuditLog({ actorId: context.actorId, action: "export", module: "quotations", targetType: "quotation_version", targetId: version.id, metadata: { quotationId: id, quotationCode: quotation.quotationCode, fileName }, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return { fileName, buffer };
}
