import { AppError } from "../../utils/app-error";

export interface PaginationInput {
  page: number;
  pageSize: number;
}

export function getPagination(input: PaginationInput) {
  return {
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize
  };
}

export function getPaginationMeta(input: PaginationInput, total: number) {
  return {
    page: input.page,
    pageSize: input.pageSize,
    total,
    totalPages: Math.ceil(total / input.pageSize)
  };
}

export function handlePrismaError(error: unknown): never {
  if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
    throw new AppError(409, "A record with the same unique value already exists");
  }

  throw error;
}

export function hasPermission(user: Express.Request["user"], permission: string) {
  return Boolean(user?.permissions.includes(permission));
}

export function canViewSensitiveEmployeeFields(user: Express.Request["user"], employeeId?: string | null) {
  return hasPermission(user, "employees.view_sensitive") || Boolean(employeeId && user?.employeeId === employeeId);
}
