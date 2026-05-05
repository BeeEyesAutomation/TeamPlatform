import { createAuditLog } from "../audit/audit.service";
import { prisma } from "../../prisma/client";
import { AppError } from "../../utils/app-error";
import { getPagination, getPaginationMeta, handlePrismaError } from "../hr/hr.utils";
import { findDepartmentById, listDepartments } from "./departments.repository";
import type { z } from "zod";
import type { departmentCreateSchema, departmentQuerySchema, departmentUpdateSchema } from "../hr/hr.schemas";

type DepartmentQuery = z.infer<typeof departmentQuerySchema>;
type DepartmentCreate = z.infer<typeof departmentCreateSchema>;
type DepartmentUpdate = z.infer<typeof departmentUpdateSchema>;

interface RequestContext {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function getDepartments(query: DepartmentQuery) {
  const pagination = getPagination(query);
  const [total, items] = await listDepartments(query, pagination.skip, pagination.take);

  return {
    items,
    meta: getPaginationMeta(query, total)
  };
}

export async function getDepartment(id: string) {
  const department = await findDepartmentById(id);

  if (!department) {
    throw new AppError(404, "Department not found");
  }

  return department;
}

export async function createDepartment(data: DepartmentCreate, context: RequestContext) {
  try {
    const department = await prisma.department.create({ data });
    await createAuditLog({
      actorId: context.actorId,
      action: "create",
      module: "departments",
      targetType: "department",
      targetId: department.id,
      newValue: department,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return department;
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function updateDepartment(id: string, data: DepartmentUpdate, context: RequestContext) {
  const existing = await getDepartment(id);

  try {
    const department = await prisma.department.update({
      where: { id },
      data
    });
    await createAuditLog({
      actorId: context.actorId,
      action: "update",
      module: "departments",
      targetType: "department",
      targetId: id,
      oldValue: existing,
      newValue: department,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return department;
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function deactivateDepartment(id: string, context: RequestContext) {
  const existing = await getDepartment(id);
  const department = await prisma.department.update({
    where: { id },
    data: {
      status: "inactive",
      deletedAt: new Date()
    }
  });

  await createAuditLog({
    actorId: context.actorId,
    action: "deactivate",
    module: "departments",
    targetType: "department",
    targetId: id,
    oldValue: existing,
    newValue: department,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return department;
}
