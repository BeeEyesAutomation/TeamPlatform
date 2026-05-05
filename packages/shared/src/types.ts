export type ApiStatus = "ok" | "error";

export interface ApiResponse<T> {
  status: ApiStatus;
  data: T;
}

export interface ApiErrorResponse {
  status: "error";
  message: string;
  details?: unknown;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}
