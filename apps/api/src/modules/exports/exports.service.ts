import puppeteer from "puppeteer";
import { prisma } from "../../prisma/client";
import { getPagination, getPaginationMeta } from "../hr/hr.utils";
import { buildRowsWorkbook, rowsToCsv } from "../imports/imports.utils";
import type { z } from "zod";
import type { exportLogQuerySchema, exportQuerySchema } from "./exports.schemas";

type ExportQuery = z.infer<typeof exportQuerySchema>;
type ExportLogQuery = z.infer<typeof exportLogQuerySchema>;

interface RequestContext {
  actorId?: string;
}

function normalizeRows(rows: Array<Record<string, unknown>>) {
  return rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value])));
}

async function htmlToPdf(title: string, rows: Array<Record<string, unknown>>) {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const html = `<html><body><h1>${title}</h1><table border="1" cellspacing="0" cellpadding="4"><thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((header) => `<td>${String(row[header] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html);
    return Buffer.from(await page.pdf({ format: "A4" }));
  } finally {
    await browser.close();
  }
}

async function rowsForExport(type: string, query: ExportQuery) {
  if (type === "employees") {
    const rows = await prisma.employee.findMany({ where: { deletedAt: null }, orderBy: { fullName: "asc" } });
    return normalizeRows(rows.map((row) => ({ employeeCode: row.employeeCode, fullName: row.fullName, email: row.email, phone: row.phone, status: row.status })));
  }
  if (type === "attendance") {
    const rows = await prisma.attendanceRecord.findMany({ orderBy: { date: "desc" }, take: 500 });
    return normalizeRows(rows.map((row) => ({ employeeId: row.employeeId, date: row.date, status: row.status })));
  }
  if (type === "payroll") {
    const rows = await prisma.payroll.findMany({ where: query.month ? { month: query.month } : {}, orderBy: { createdAt: "desc" } });
    return normalizeRows(rows.map((row) => ({ employeeId: row.employeeId, month: row.month, status: row.status, netSalary: row.netSalary.toString() })));
  }
  if (type === "projects") {
    const rows = await prisma.project.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } });
    return normalizeRows(rows.map((row) => ({ projectCode: row.projectCode, name: row.name, status: row.status, progressPercent: row.progressPercent.toString(), budgetEstimated: row.budgetEstimated?.toString() })));
  }
  if (type === "project_costs") {
    const rows = await prisma.projectCost.findMany({ where: query.projectId ? { projectId: query.projectId } : {}, orderBy: { costDate: "desc" } });
    return normalizeRows(rows.map((row) => ({ projectId: row.projectId, costType: row.costType, name: row.name, amount: row.amount.toString(), costDate: row.costDate })));
  }
  if (type === "project_issues") {
    const rows = await prisma.projectIssue.findMany({ where: query.projectId ? { projectId: query.projectId } : {}, orderBy: { createdAt: "desc" } });
    return normalizeRows(rows.map((row) => ({ projectId: row.projectId, title: row.title, severity: row.severity, status: row.status, deadline: row.deadline })));
  }
  if (type === "project_materials") {
    const rows = await prisma.projectMaterial.findMany({ where: query.projectId ? { projectId: query.projectId } : {}, orderBy: { materialName: "asc" } });
    return normalizeRows(rows.map((row) => ({ projectId: row.projectId, materialCode: row.materialCode, materialName: row.materialName, plannedQuantity: row.plannedQuantity.toString(), usedQuantity: row.usedQuantity.toString(), status: row.status })));
  }
  if (type === "inventory_items") {
    const rows = await prisma.inventoryItem.findMany({
      where: {
        deletedAt: null,
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query.supplierId ? { supplierId: query.supplierId } : {})
      },
      include: {
        category: { select: { code: true, name: true } },
        supplier: { select: { code: true, name: true } }
      },
      orderBy: { materialName: "asc" }
    });
    return normalizeRows(rows.map((row) => ({
      materialCode: row.materialCode,
      materialName: row.materialName,
      category: row.category?.name,
      supplier: row.supplier?.name,
      purchasePrice: row.purchasePrice.toString(),
      sellingPrice: row.sellingPrice.toString(),
      markupPercentage: row.markupPercentage.toString(),
      stockQuantity: row.stockQuantity.toString(),
      minimumStockQuantity: row.minimumStockQuantity.toString(),
      unit: row.unit,
      status: row.status,
      description: row.description
    })));
  }
  if (type === "inventory_movements") {
    const rows = await prisma.inventoryStockMovement.findMany({
      where: query.projectId ? { projectId: query.projectId } : {},
      include: { item: { select: { materialCode: true, materialName: true, unit: true } } },
      orderBy: { createdAt: "desc" },
      take: 1000
    });
    return normalizeRows(rows.map((row) => ({
      materialCode: row.item.materialCode,
      materialName: row.item.materialName,
      movementType: row.movementType,
      quantity: row.quantity.toString(),
      unit: row.item.unit,
      unitCost: row.unitCost?.toString(),
      previousStock: row.previousStock.toString(),
      resultingStock: row.resultingStock.toString(),
      referenceType: row.referenceType,
      projectId: row.projectId,
      createdAt: row.createdAt
    })));
  }
  const rows = await prisma.projectTask.findMany({ where: query.projectId ? { projectId: query.projectId } : {}, orderBy: { createdAt: "desc" } });
  return normalizeRows(rows.map((row) => ({ projectId: row.projectId, title: row.title, status: row.status, progressPercent: row.progressPercent.toString(), deadline: row.deadline })));
}

export async function generateExport(type: string, query: ExportQuery, context: RequestContext) {
  const rows = await rowsForExport(type, query);
  const extension = query.format === "excel" ? "xlsx" : query.format;
  const fileName = `${type}.${extension}`;
  const buffer = query.format === "excel"
    ? await buildRowsWorkbook(type, rows)
    : query.format === "pdf"
      ? await htmlToPdf(type, rows)
      : Buffer.from(rowsToCsv(rows), "utf8");

  await prisma.exportLog.create({
    data: {
      exportType: type,
      fileName,
      format: query.format,
      filtersJson: query as any,
      exportedById: context.actorId,
      metadata: { rowCount: rows.length }
    }
  });

  return { fileName, buffer, format: query.format };
}

export async function listExportLogs(query: ExportLogQuery) {
  const pagination = getPagination(query);
  const where = {
    ...(query.exportType ? { exportType: query.exportType } : {}),
    ...(query.format ? { format: query.format } : {})
  };
  const [total, items] = await Promise.all([
    prisma.exportLog.count({ where }),
    prisma.exportLog.findMany({ where, orderBy: { createdAt: "desc" }, ...pagination })
  ]);

  return { items, meta: getPaginationMeta(query, total) };
}
