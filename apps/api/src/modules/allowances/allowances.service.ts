import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { AppError } from "../../utils/app-error";
import { createAuditLog } from "../audit/audit.service";
import { getPagination, getPaginationMeta, handlePrismaError } from "../hr/hr.utils";
import type { z } from "zod";
import type { allowanceTypeCreateSchema, allowanceTypeQuerySchema, allowanceTypeUpdateSchema } from "./allowances.schemas";

type AllowanceTypeQuery = z.infer<typeof allowanceTypeQuerySchema>;
type AllowanceTypeCreate = z.infer<typeof allowanceTypeCreateSchema>;
type AllowanceTypeUpdate = z.infer<typeof allowanceTypeUpdateSchema>;

interface RequestContext {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function listAllowanceTypes(query: AllowanceTypeQuery) {
  const pagination = getPagination(query);
  const where = {
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.calculationType ? { calculationType: query.calculationType } : {}),
    ...(query.applyScope ? { applyScope: query.applyScope } : {}),
    ...(query.search
      ? {
          OR: [
            { code: { contains: query.search, mode: "insensitive" as const } },
            { name: { contains: query.search, mode: "insensitive" as const } }
          ]
        }
      : {})
  };
  const [total, items] = await Promise.all([
    prisma.allowanceType.count({ where }),
    prisma.allowanceType.findMany({
      where,
      orderBy: [{ status: "asc" }, { code: "asc" }],
      ...pagination
    })
  ]);

  return {
    items,
    meta: getPaginationMeta(query, total)
  };
}

export async function getAllowanceType(id: string) {
  const allowanceType = await prisma.allowanceType.findFirst({
    where: {
      id,
      deletedAt: null
    }
  });

  if (!allowanceType) {
    throw new AppError(404, "Allowance type not found");
  }

  return allowanceType;
}

export async function createAllowanceType(data: AllowanceTypeCreate, context: RequestContext) {
  try {
    const allowanceType = await prisma.allowanceType.create({
      data: {
        ...data,
        metadata: data.metadata as Prisma.InputJsonValue | undefined
      }
    });

    await createAuditLog({
      actorId: context.actorId,
      action: "create",
      module: "payroll_configuration",
      targetType: "allowance_type",
      targetId: allowanceType.id,
      newValue: allowanceType,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return allowanceType;
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function updateAllowanceType(id: string, data: AllowanceTypeUpdate, context: RequestContext) {
  const existing = await getAllowanceType(id);

  try {
    const allowanceType = await prisma.allowanceType.update({
      where: { id },
      data: {
        ...data,
        metadata: data.metadata as Prisma.InputJsonValue | undefined
      }
    });

    await createAuditLog({
      actorId: context.actorId,
      action: "update",
      module: "payroll_configuration",
      targetType: "allowance_type",
      targetId: id,
      oldValue: existing,
      newValue: allowanceType,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return allowanceType;
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function deactivateAllowanceType(id: string, context: RequestContext) {
  const existing = await getAllowanceType(id);
  const allowanceType = await prisma.allowanceType.update({
    where: { id },
    data: {
      status: "inactive",
      deletedAt: new Date()
    }
  });

  await createAuditLog({
    actorId: context.actorId,
    action: "deactivate",
    module: "payroll_configuration",
    targetType: "allowance_type",
    targetId: id,
    oldValue: existing,
    newValue: allowanceType,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return allowanceType;
}
