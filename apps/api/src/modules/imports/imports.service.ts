import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { AppError } from "../../utils/app-error";
import { getPagination, getPaginationMeta } from "../hr/hr.utils";
import { buildRowsWorkbook, buildTemplateWorkbook, isImportType, validateRows, type ImportType } from "./imports.utils";
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
