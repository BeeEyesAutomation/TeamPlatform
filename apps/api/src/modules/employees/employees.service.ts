import type { z } from "zod";
import { prisma } from "../../prisma/client";
import { AppError } from "../../utils/app-error";
import { createAuditLog } from "../audit/audit.service";
import type { employeeCreateSchema, employeeQuerySchema, employeeUpdateSchema } from "../hr/hr.schemas";
import { canViewSensitiveEmployeeFields, getPagination, getPaginationMeta, handlePrismaError } from "../hr/hr.utils";
import { findEmployeeById, listEmployees } from "./employees.repository";

type EmployeeQuery = z.infer<typeof employeeQuerySchema>;
type EmployeeCreate = z.infer<typeof employeeCreateSchema>;
type EmployeeUpdate = z.infer<typeof employeeUpdateSchema>;

interface RequestContext {
  user?: Express.Request["user"];
  ipAddress?: string;
  userAgent?: string;
}

const sensitiveEmployeeFields = [
  "citizenIdNumber",
  "citizenIdIssueDate",
  "citizenIdIssuePlace",
  "citizenIdFrontImageUrl",
  "citizenIdBackImageUrl",
  "bankName",
  "bankAccountNumber",
  "bankAccountHolder",
  "bankBranch",
  "salaryLevel",
  "dependentCount"
] as const;

const toEmployeeData = (data: EmployeeCreate | EmployeeUpdate) => ({
  ...data,
  dateOfBirth: data.dateOfBirth,
  citizenIdIssueDate: data.citizenIdIssueDate,
  startDate: data.startDate
});

const maskSensitiveFields = <T extends Record<string, any>>(employee: T, canViewSensitive: boolean) => {
  if (canViewSensitive) {
    return employee;
  }

  const masked = { ...employee };
  for (const field of sensitiveEmployeeFields) {
    if (field in masked) {
      masked[field] = null;
    }
  }

  if (masked.position) {
    masked.position = {
      ...masked.position,
      baseSalary: null,
      salaryStepAmount: null
    };
  }

  return masked;
};

const getSensitiveChanges = (oldValue: Record<string, any>, newValue: Record<string, any>) => {
  return sensitiveEmployeeFields.filter((field) => {
    if (!(field in newValue)) {
      return false;
    }

    const before = oldValue[field] instanceof Date ? oldValue[field].toISOString() : oldValue[field];
    const after = newValue[field] instanceof Date ? newValue[field].toISOString() : newValue[field];
    return before !== after;
  });
};

export async function getEmployees(query: EmployeeQuery, context: RequestContext) {
  const pagination = getPagination(query);
  const [total, items] = await listEmployees(query, pagination.skip, pagination.take);

  return {
    items: items.map((employee) =>
      maskSensitiveFields(employee, canViewSensitiveEmployeeFields(context.user, employee.id))
    ),
    meta: getPaginationMeta(query, total)
  };
}

export async function getEmployee(id: string, context: RequestContext) {
  const employee = await findEmployeeById(id);

  if (!employee) {
    throw new AppError(404, "Employee not found");
  }

  return maskSensitiveFields(employee, canViewSensitiveEmployeeFields(context.user, employee.id));
}

export async function createEmployee(data: EmployeeCreate, context: RequestContext) {
  try {
    const employee = await prisma.employee.create({
      data: toEmployeeData(data),
      include: {
        department: true,
        position: true
      }
    });

    await createAuditLog({
      actorId: context.user?.id,
      action: "create",
      module: "employees",
      targetType: "employee",
      targetId: employee.id,
      newValue: employee,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    const sensitiveFields = sensitiveEmployeeFields.filter((field) => data[field] !== undefined);
    if (sensitiveFields.length) {
      await createAuditLog({
        actorId: context.user?.id,
        action: "sensitive_fields_set",
        module: "employees",
        targetType: "employee",
        targetId: employee.id,
        metadata: { fields: sensitiveFields },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      });
    }

    return employee;
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function updateEmployee(id: string, data: EmployeeUpdate, context: RequestContext) {
  const existing = await findEmployeeById(id);

  if (!existing) {
    throw new AppError(404, "Employee not found");
  }

  try {
    const employee = await prisma.employee.update({
      where: { id },
      data: toEmployeeData(data),
      include: {
        department: true,
        position: true
      }
    });
    const sensitiveChanges = getSensitiveChanges(existing, data);

    await createAuditLog({
      actorId: context.user?.id,
      action: "update",
      module: "employees",
      targetType: "employee",
      targetId: id,
      oldValue: existing,
      newValue: employee,
      metadata: {
        sensitiveFieldsChanged: sensitiveChanges
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    if (sensitiveChanges.length) {
      await createAuditLog({
        actorId: context.user?.id,
        action: "sensitive_fields_update",
        module: "employees",
        targetType: "employee",
        targetId: id,
        metadata: { fields: sensitiveChanges },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      });
    }

    return employee;
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function deactivateEmployee(id: string, context: RequestContext) {
  const existing = await findEmployeeById(id);

  if (!existing) {
    throw new AppError(404, "Employee not found");
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      status: "resigned",
      deletedAt: new Date()
    },
    include: {
      department: true,
      position: true
    }
  });

  await createAuditLog({
    actorId: context.user?.id,
    action: "deactivate",
    module: "employees",
    targetType: "employee",
    targetId: id,
    oldValue: existing,
    newValue: employee,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return employee;
}

export async function getSalaryPreview(id: string, context: RequestContext) {
  const employee = await findEmployeeById(id);

  if (!employee) {
    throw new AppError(404, "Employee not found");
  }

  if (!canViewSensitiveEmployeeFields(context.user, employee.id)) {
    throw new AppError(403, "Permission denied");
  }

  if (!employee.position) {
    throw new AppError(400, "Employee does not have a position assigned");
  }

  const baseSalary = Number(employee.position.baseSalary);
  const salaryStepAmount = Number(employee.position.salaryStepAmount);
  const salaryLevel = employee.salaryLevel;

  return {
    employeeId: employee.id,
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    positionId: employee.position.id,
    positionName: employee.position.name,
    baseSalary,
    salaryStepAmount,
    salaryLevel,
    salary: baseSalary + salaryStepAmount * salaryLevel
  };
}
