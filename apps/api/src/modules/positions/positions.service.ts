import type { z } from "zod";
import { prisma } from "../../prisma/client";
import { AppError } from "../../utils/app-error";
import { createAuditLog } from "../audit/audit.service";
import type { positionCreateSchema, positionQuerySchema, positionUpdateSchema } from "../hr/hr.schemas";
import { getPagination, getPaginationMeta, handlePrismaError } from "../hr/hr.utils";
import { findPositionById, listPositions } from "./positions.repository";

type PositionQuery = z.infer<typeof positionQuerySchema>;
type PositionCreate = z.infer<typeof positionCreateSchema>;
type PositionUpdate = z.infer<typeof positionUpdateSchema>;

interface RequestContext {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
}

const toPositionData = (data: PositionCreate | PositionUpdate) => ({
  ...data,
  ...(data.baseSalary !== undefined ? { baseSalary: data.baseSalary.toString() } : {}),
  ...(data.salaryStepAmount !== undefined ? { salaryStepAmount: data.salaryStepAmount.toString() } : {})
});

export async function getPositions(query: PositionQuery) {
  const pagination = getPagination(query);
  const [total, items] = await listPositions(query, pagination.skip, pagination.take);

  return {
    items,
    meta: getPaginationMeta(query, total)
  };
}

export async function getPosition(id: string) {
  const position = await findPositionById(id);

  if (!position) {
    throw new AppError(404, "Position not found");
  }

  return position;
}

export async function createPosition(data: PositionCreate, context: RequestContext) {
  try {
    const position = await prisma.position.create({ data: toPositionData(data) });
    await createAuditLog({
      actorId: context.actorId,
      action: "create",
      module: "positions",
      targetType: "position",
      targetId: position.id,
      newValue: position,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return position;
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function updatePosition(id: string, data: PositionUpdate, context: RequestContext) {
  const existing = await getPosition(id);

  try {
    const position = await prisma.position.update({
      where: { id },
      data: toPositionData(data)
    });

    await createAuditLog({
      actorId: context.actorId,
      action: "update",
      module: "positions",
      targetType: "position",
      targetId: id,
      oldValue: existing,
      newValue: position,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return position;
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function deactivatePosition(id: string, context: RequestContext) {
  const existing = await getPosition(id);
  const position = await prisma.position.update({
    where: { id },
    data: {
      status: "inactive",
      deletedAt: new Date()
    }
  });

  await createAuditLog({
    actorId: context.actorId,
    action: "deactivate",
    module: "positions",
    targetType: "position",
    targetId: id,
    oldValue: existing,
    newValue: position,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return position;
}
