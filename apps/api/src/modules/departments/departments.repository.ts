import { prisma } from "../../prisma/client";

export interface DepartmentListFilters {
  search?: string;
  status?: "active" | "inactive";
}

export function buildDepartmentWhere(filters: DepartmentListFilters) {
  return {
    deletedAt: null,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" as const } },
            { code: { contains: filters.search, mode: "insensitive" as const } }
          ]
        }
      : {})
  };
}

export function listDepartments(filters: DepartmentListFilters, skip: number, take: number) {
  const where = buildDepartmentWhere(filters);

  return prisma.$transaction([
    prisma.department.count({ where }),
    prisma.department.findMany({
      where,
      skip,
      take,
      orderBy: [{ status: "asc" }, { name: "asc" }]
    })
  ]);
}

export function findDepartmentById(id: string) {
  return prisma.department.findFirst({
    where: {
      id,
      deletedAt: null
    }
  });
}
