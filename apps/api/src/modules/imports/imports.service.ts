import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { AppError } from "../../utils/app-error";
import { getPagination, getPaginationMeta } from "../hr/hr.utils";
import { buildRowsWorkbook, buildTemplateWorkbook, isImportType, parseRowsWorkbook, validateRows, type ImportType } from "./imports.utils";
import type { z } from "zod";
import type { importLogQuerySchema, importPreviewSchema } from "./imports.schemas";

type ImportPreviewInput = z.infer<typeof importPreviewSchema>;
type ImportLogQuery = z.infer<typeof importLogQuerySchema>;

interface RequestContext {
  actorId?: string;
}

export async function getTemplate(type: string) {
  if (!isImportType(type)) {
    throw new AppError(400, "Unsupported import template type");
  }

  return {
    fileName: `${type}_template.xlsx`,
    buffer: await buildTemplateWorkbook(type)
  };
}

async function applyImport(type: ImportType, validRows: Array<Record<string, unknown>>) {
  if (type === "projects") {
    for (const row of validRows) {
      await prisma.project.upsert({
        where: { projectCode: String(row.projectCode) },
        update: {
          name: String(row.name),
          customerName: row.customerName ? String(row.customerName) : undefined,
          budgetEstimated: row.budgetEstimated ? String(row.budgetEstimated) : undefined
        },
        create: {
          projectCode: String(row.projectCode),
          name: String(row.name),
          customerName: row.customerName ? String(row.customerName) : undefined,
          budgetEstimated: row.budgetEstimated ? String(row.budgetEstimated) : undefined
        }
      });
    }
  }

  if (type === "employees") {
    for (const row of validRows) {
      await prisma.employee.upsert({
        where: { employeeCode: String(row.employeeCode) },
        update: {
          fullName: String(row.fullName),
          email: row.email ? String(row.email) : undefined,
          phone: row.phone ? String(row.phone) : undefined
        },
        create: {
          employeeCode: String(row.employeeCode),
          fullName: String(row.fullName),
          email: row.email ? String(row.email) : undefined,
          phone: row.phone ? String(row.phone) : undefined
        }
      });
    }
  }

  if (type === "inventory_categories") {
    for (const row of validRows) {
      await prisma.inventoryCategory.upsert({
        where: { code: String(row.code) },
        update: {
          name: String(row.name),
          description: row.description ? String(row.description) : undefined,
          status: row.status ? String(row.status) as "active" | "inactive" : undefined
        },
        create: {
          code: String(row.code),
          name: String(row.name),
          description: row.description ? String(row.description) : undefined,
          status: row.status ? String(row.status) as "active" | "inactive" : "active"
        }
      });
    }
  }

  if (type === "inventory_suppliers") {
    for (const row of validRows) {
      await prisma.inventorySupplier.upsert({
        where: { code: String(row.code) },
        update: {
          name: String(row.name),
          contactName: row.contactName ? String(row.contactName) : undefined,
          phone: row.phone ? String(row.phone) : undefined,
          email: row.email ? String(row.email) : undefined,
          address: row.address ? String(row.address) : undefined,
          taxCode: row.taxCode ? String(row.taxCode) : undefined,
          status: row.status ? String(row.status) as "active" | "inactive" : undefined
        },
        create: {
          code: String(row.code),
          name: String(row.name),
          contactName: row.contactName ? String(row.contactName) : undefined,
          phone: row.phone ? String(row.phone) : undefined,
          email: row.email ? String(row.email) : undefined,
          address: row.address ? String(row.address) : undefined,
          taxCode: row.taxCode ? String(row.taxCode) : undefined,
          status: row.status ? String(row.status) as "active" | "inactive" : "active"
        }
      });
    }
  }

  if (type === "inventory_items") {
    for (const row of validRows) {
      const category = row.categoryCode
        ? await prisma.inventoryCategory.findUnique({ where: { code: String(row.categoryCode) } })
        : null;
      const supplier = row.supplierCode
        ? await prisma.inventorySupplier.findUnique({ where: { code: String(row.supplierCode) } })
        : null;

      await prisma.inventoryItem.upsert({
        where: { materialCode: String(row.materialCode) },
        update: {
          materialName: String(row.materialName),
          categoryId: category?.id,
          supplierId: supplier?.id,
          purchasePrice: row.purchasePrice ? String(row.purchasePrice) : "0",
          sellingPrice: row.sellingPrice ? String(row.sellingPrice) : "0",
          markupPercentage: row.markupPercentage ? String(row.markupPercentage) : "0",
          stockQuantity: row.stockQuantity ? String(row.stockQuantity) : "0",
          minimumStockQuantity: row.minimumStockQuantity ? String(row.minimumStockQuantity) : "0",
          unit: String(row.unit),
          status: row.status ? String(row.status) as "active" | "inactive" | "discontinued" : "active",
          description: row.description ? String(row.description) : undefined
        },
        create: {
          materialCode: String(row.materialCode),
          materialName: String(row.materialName),
          categoryId: category?.id,
          supplierId: supplier?.id,
          purchasePrice: row.purchasePrice ? String(row.purchasePrice) : "0",
          sellingPrice: row.sellingPrice ? String(row.sellingPrice) : "0",
          markupPercentage: row.markupPercentage ? String(row.markupPercentage) : "0",
          stockQuantity: row.stockQuantity ? String(row.stockQuantity) : "0",
          minimumStockQuantity: row.minimumStockQuantity ? String(row.minimumStockQuantity) : "0",
          unit: String(row.unit),
          status: row.status ? String(row.status) as "active" | "inactive" | "discontinued" : "active",
          description: row.description ? String(row.description) : undefined
        }
      });
    }
  }

  if (type === "inventory_stock_adjustments") {
    for (const row of validRows) {
      const item = await prisma.inventoryItem.findUnique({
        where: { materialCode: String(row.materialCode) }
      });
      if (!item) throw new AppError(400, `Inventory item not found: ${String(row.materialCode)}`);

      const quantity = Number(row.quantity);
      const delta = String(row.direction) === "decrease" ? -quantity : quantity;
      const previousStock = Number(item.stockQuantity);
      const resultingStock = previousStock + delta;
      if (resultingStock < 0) throw new AppError(400, `Insufficient stock for ${item.materialCode}`);

      await prisma.$transaction([
        prisma.inventoryItem.update({
          where: { id: item.id },
          data: { stockQuantity: resultingStock.toString() }
        }),
        prisma.inventoryStockMovement.create({
          data: {
            itemId: item.id,
            movementType: "adjustment",
            quantity: quantity.toString(),
            unitCost: row.unitCost ? String(row.unitCost) : undefined,
            previousStock: previousStock.toString(),
            resultingStock: resultingStock.toString(),
            referenceType: row.referenceType ? String(row.referenceType) : "import",
            referenceId: row.referenceId ? String(row.referenceId) : undefined,
            note: row.note ? String(row.note) : undefined,
            metadata: { direction: String(row.direction) === "decrease" ? "decrease" : "increase" }
          }
        })
      ]);
    }
  }
}

export async function previewOrConfirmImport(type: string, input: ImportPreviewInput, context: RequestContext) {
  if (!isImportType(type)) {
    throw new AppError(400, "Unsupported import type");
  }

  const validation = validateRows(type, input.rows);
  const validRows = validation.filter((row) => row.valid).map((row) => row.row);
  const failedRows = validation.filter((row) => !row.valid);
  const shouldComplete = input.confirm && failedRows.length === 0;

  if (shouldComplete) {
    await applyImport(type, validRows);
  }

  const log = await prisma.importLog.create({
    data: {
      importType: type,
      fileName: input.fileName,
      status: shouldComplete ? "completed" : failedRows.length ? "failed" : "pending",
      totalRows: input.rows.length,
      successRows: shouldComplete ? validRows.length : 0,
      failedRows: failedRows.length,
      errorFileUrl: failedRows.length ? `import-log://${type}/errors` : undefined,
      importedById: context.actorId,
      metadata: {
        previewRows: validation,
        confirmed: shouldComplete
      } as Prisma.InputJsonObject
    }
  });

  return {
    log,
    rows: validation
  };
}

export async function previewOrConfirmImportWorkbook(
  type: string,
  fileName: string,
  buffer: Buffer,
  confirm: boolean,
  context: RequestContext
) {
  const rows = await parseRowsWorkbook(buffer);
  return previewOrConfirmImport(type, { fileName, rows, confirm }, context);
}

export async function listImportLogs(query: ImportLogQuery) {
  const pagination = getPagination(query);
  const where = {
    ...(query.importType ? { importType: query.importType } : {}),
    ...(query.status ? { status: query.status } : {})
  };
  const [total, items] = await Promise.all([
    prisma.importLog.count({ where }),
    prisma.importLog.findMany({ where, orderBy: { createdAt: "desc" }, ...pagination })
  ]);

  return {
    items,
    meta: getPaginationMeta(query, total)
  };
}

export async function getImportErrorFile(id: string) {
  const log = await prisma.importLog.findUnique({ where: { id } });
  if (!log) throw new AppError(404, "Import log not found");

  const rows = ((log.metadata as { previewRows?: Array<{ row: Record<string, unknown>; valid: boolean; errors: string[] }> } | null)?.previewRows ?? [])
    .filter((row) => !row.valid)
    .map((row) => ({ ...row.row, errors: row.errors.join("; ") }));

  return {
    fileName: `${log.importType}_errors.xlsx`,
    buffer: await buildRowsWorkbook("errors", rows)
  };
}
