import { prisma } from "../../prisma/client";
import { AppError } from "../../utils/app-error";
import { createAuditLog } from "../audit/audit.service";
import { getPagination, getPaginationMeta, handlePrismaError } from "../hr/hr.utils";
import type { z } from "zod";
import type {
  taxBracketCreateSchema,
  taxBracketQuerySchema,
  taxBracketUpdateSchema,
  taxSettingCreateSchema,
  taxSettingQuerySchema,
  taxSettingUpdateSchema
} from "./tax.schemas";

type TaxSettingQuery = z.infer<typeof taxSettingQuerySchema>;
type TaxSettingCreate = z.infer<typeof taxSettingCreateSchema>;
type TaxSettingUpdate = z.infer<typeof taxSettingUpdateSchema>;
type TaxBracketQuery = z.infer<typeof taxBracketQuerySchema>;
type TaxBracketCreate = z.infer<typeof taxBracketCreateSchema>;
type TaxBracketUpdate = z.infer<typeof taxBracketUpdateSchema>;

interface RequestContext {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
}

const taxSettingInclude = {
  taxBrackets: {
    orderBy: {
      level: "asc" as const
    }
  }
};

export async function listTaxSettings(query: TaxSettingQuery) {
  const pagination = getPagination(query);
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { id: { contains: query.search, mode: "insensitive" as const } }
          ]
        }
      : {})
  };
  const [total, items] = await Promise.all([
    prisma.taxSetting.count({ where }),
    prisma.taxSetting.findMany({
      where,
      include: taxSettingInclude,
      orderBy: [{ status: "asc" }, { effectiveFrom: "desc" }],
      ...pagination
    })
  ]);

  return {
    items,
    meta: getPaginationMeta(query, total)
  };
}

export async function getTaxSetting(id: string) {
  const taxSetting = await prisma.taxSetting.findUnique({
    where: { id },
    include: taxSettingInclude
  });

  if (!taxSetting) {
    throw new AppError(404, "Tax setting not found");
  }

  return taxSetting;
}

export async function createTaxSetting(data: TaxSettingCreate, context: RequestContext) {
  try {
    const taxSetting = await prisma.taxSetting.create({
      data,
      include: taxSettingInclude
    });

    await createAuditLog({
      actorId: context.actorId,
      action: "create",
      module: "payroll_configuration",
      targetType: "tax_setting",
      targetId: taxSetting.id,
      newValue: taxSetting,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return taxSetting;
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function updateTaxSetting(id: string, data: TaxSettingUpdate, context: RequestContext) {
  const existing = await getTaxSetting(id);

  try {
    const taxSetting = await prisma.taxSetting.update({
      where: { id },
      data,
      include: taxSettingInclude
    });

    await createAuditLog({
      actorId: context.actorId,
      action: "update",
      module: "payroll_configuration",
      targetType: "tax_setting",
      targetId: id,
      oldValue: existing,
      newValue: taxSetting,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return taxSetting;
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function activateTaxSetting(id: string, context: RequestContext) {
  const existing = await getTaxSetting(id);

  const taxSetting = await prisma.$transaction(async (tx) => {
    await tx.taxSetting.updateMany({
      where: {
        id: {
          not: id
        },
        status: "active"
      },
      data: {
        status: "inactive"
      }
    });

    return tx.taxSetting.update({
      where: { id },
      data: { status: "active" },
      include: taxSettingInclude
    });
  });

  await createAuditLog({
    actorId: context.actorId,
    action: "activate",
    module: "payroll_configuration",
    targetType: "tax_setting",
    targetId: id,
    oldValue: existing,
    newValue: taxSetting,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return taxSetting;
}

export async function listTaxBrackets(query: TaxBracketQuery) {
  const pagination = getPagination(query);
  const where = {
    ...(query.taxSettingId ? { taxSettingId: query.taxSettingId } : {}),
    ...(query.search
      ? {
          OR: [
            { taxSettingId: { contains: query.search, mode: "insensitive" as const } }
          ]
        }
      : {})
  };
  const [total, items] = await Promise.all([
    prisma.taxBracket.count({ where }),
    prisma.taxBracket.findMany({
      where,
      orderBy: [{ taxSettingId: "asc" }, { level: "asc" }],
      ...pagination
    })
  ]);

  return {
    items,
    meta: getPaginationMeta(query, total)
  };
}

export async function getTaxBracket(id: string) {
  const taxBracket = await prisma.taxBracket.findUnique({
    where: { id }
  });

  if (!taxBracket) {
    throw new AppError(404, "Tax bracket not found");
  }

  return taxBracket;
}

export async function createTaxBracket(data: TaxBracketCreate, context: RequestContext) {
  await getTaxSetting(data.taxSettingId);

  try {
    const taxBracket = await prisma.taxBracket.create({ data });

    await createAuditLog({
      actorId: context.actorId,
      action: "create",
      module: "payroll_configuration",
      targetType: "tax_bracket",
      targetId: taxBracket.id,
      newValue: taxBracket,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return taxBracket;
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function updateTaxBracket(id: string, data: TaxBracketUpdate, context: RequestContext) {
  const existing = await getTaxBracket(id);

  if (data.taxSettingId) {
    await getTaxSetting(data.taxSettingId);
  }

  const nextIncomeFrom = data.incomeFrom ?? existing.incomeFrom.toString();
  const nextIncomeTo = data.incomeTo ?? existing.incomeTo?.toString();
  if (nextIncomeTo !== undefined && Number(nextIncomeTo) <= Number(nextIncomeFrom)) {
    throw new AppError(400, "Income to must be greater than income from");
  }

  try {
    const taxBracket = await prisma.taxBracket.update({
      where: { id },
      data
    });

    await createAuditLog({
      actorId: context.actorId,
      action: "update",
      module: "payroll_configuration",
      targetType: "tax_bracket",
      targetId: id,
      oldValue: existing,
      newValue: taxBracket,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return taxBracket;
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function deleteTaxBracket(id: string, context: RequestContext) {
  const existing = await getTaxBracket(id);
  const taxBracket = await prisma.taxBracket.delete({
    where: { id }
  });

  await createAuditLog({
    actorId: context.actorId,
    action: "delete",
    module: "payroll_configuration",
    targetType: "tax_bracket",
    targetId: id,
    oldValue: existing,
    newValue: taxBracket,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return taxBracket;
}

