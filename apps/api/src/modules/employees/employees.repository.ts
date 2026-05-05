import { prisma } from "../../prisma/client";

export interface EmployeeListFilters {
  search?: string;
  departmentId?: string;
  positionId?: string;
  status?: "probation" | "active" | "temporarily_inactive" | "resigned";
}

export const employeeInclude = {
  department: {
    select: {
      id: true,
      code: true,
      name: true
    }
  },
  position: {
    select: {
      id: true,
      code: true,
      name: true,
      baseSalary: true,
      salaryStepAmount: true
    }
  }
} as const;

export function buildEmployeeWhere(filters: EmployeeListFilters) {
  return {
    deletedAt: null,
    ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
    ...(filters.positionId ? { positionId: filters.positionId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.search
      ? {
          OR: [
            { fullName: { contains: filters.search, mode: "insensitive" as const } },
            { employeeCode: { contains: filters.search, mode: "insensitive" as const } },
            { phone: { contains: filters.search, mode: "insensitive" as const } }
          ]
        }
      : {})
  };
}

export function listEmployees(filters: EmployeeListFilters, skip: number, take: number) {
  const where = buildEmployeeWhere(filters);

  return prisma.$transaction([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      include: employeeInclude,
      skip,
      take,
      orderBy: [{ status: "asc" }, { fullName: "asc" }]
    })
  ]);
}

export function findEmployeeById(id: string) {
  return prisma.employee.findFirst({
    where: {
      id,
      deletedAt: null
    },
    include: employeeInclude
  });
}
