import { apiGet, apiJson } from "../../lib/api-client";
import type { Department, Employee, ListResponse, Position } from "../../types/hr";

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export async function fetchDepartments(params: Record<string, string | number | undefined> = {}) {
  return apiGet<ListResponse<Department>>(`/api/departments${buildQuery(params)}`);
}

export async function fetchDepartment(id: string) {
  return apiGet<Department>(`/api/departments/${id}`);
}

export async function saveDepartment(body: Record<string, unknown>, id?: string) {
  return id ? apiJson<Department>(`/api/departments/${id}`, "PUT", body) : apiJson<Department>("/api/departments", "POST", body);
}

export async function deleteDepartment(id: string) {
  return apiJson<Department>(`/api/departments/${id}`, "DELETE");
}

export async function fetchPositions(params: Record<string, string | number | undefined> = {}) {
  return apiGet<ListResponse<Position>>(`/api/positions${buildQuery(params)}`);
}

export async function fetchPosition(id: string) {
  return apiGet<Position>(`/api/positions/${id}`);
}

export async function savePosition(body: Record<string, unknown>, id?: string) {
  return id ? apiJson<Position>(`/api/positions/${id}`, "PUT", body) : apiJson<Position>("/api/positions", "POST", body);
}

export async function deletePosition(id: string) {
  return apiJson<Position>(`/api/positions/${id}`, "DELETE");
}

export async function fetchEmployees(params: Record<string, string | number | undefined> = {}) {
  return apiGet<ListResponse<Employee>>(`/api/employees${buildQuery(params)}`);
}

export async function fetchEmployee(id: string) {
  return apiGet<Employee>(`/api/employees/${id}`);
}

export async function saveEmployee(body: Record<string, unknown>, id?: string) {
  return id ? apiJson<Employee>(`/api/employees/${id}`, "PUT", body) : apiJson<Employee>("/api/employees", "POST", body);
}

export async function deleteEmployee(id: string) {
  return apiJson<Employee>(`/api/employees/${id}`, "DELETE");
}
