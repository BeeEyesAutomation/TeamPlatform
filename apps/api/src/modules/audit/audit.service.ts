import { prisma } from "../../prisma/client";

interface AuditLogInput {
  actorId?: string | null;
  action: string;
  module: string;
  targetType?: string | null;
  targetId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function createAuditLog(input: AuditLogInput) {
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      module: input.module,
      targetType: input.targetType,
      targetId: input.targetId,
      oldValue: input.oldValue as any,
      newValue: input.newValue as any,
      metadata: input.metadata as any,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent
    }
  });
}
