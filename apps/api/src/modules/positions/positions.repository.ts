import { prisma } from "../../prisma/client";

export interface PositionListFilters {
  search?: string;
  status?: "active" | "inactive";
}

export function buildPositionWhere(filters: PositionListFilters) {
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

export function listPositions(filters: PositionListFilters, skip: number, take: number) {
  const where = buildPositionWhere(filters);

  return prisma.$transaction([
    prisma.position.count({ where }),
    prisma.position.findMany({
      where,
      skip,
      take,
      orderBy: [{ status: "asc" }, { name: "asc" }]
    })
  ]);
}

export function findPositionById(id: string) {
  return prisma.position.findFirst({
    where: {
      id,
      deletedAt: null
    }
  });
}
