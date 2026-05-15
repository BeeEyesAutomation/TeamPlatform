import { apiForm, apiGet, apiJson } from "../../lib/api-client";
import type { InventoryCategory, InventoryItem, InventoryStockMovement, InventorySupplier, InventorySummary, ListResponse } from "../../types/inventory";

const buildQuery = (params: Record<string, string | number | boolean | undefined> = {}) => {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const fetchInventoryItems = (params: Record<string, string | number | boolean | undefined> = {}) =>
  apiGet<ListResponse<InventoryItem>>(`/api/inventory/materials${buildQuery(params)}`);

export const fetchInventoryItem = (id: string) => apiGet<InventoryItem>(`/api/inventory/materials/${id}`);

export const saveInventoryItem = (body: Record<string, unknown>, id?: string) =>
  id ? apiJson<InventoryItem>(`/api/inventory/materials/${id}`, "PUT", body) : apiJson<InventoryItem>("/api/inventory/materials", "POST", body);

export const deleteInventoryItem = (id: string) => apiJson<InventoryItem>(`/api/inventory/materials/${id}`, "DELETE");

export const bulkDeactivateInventoryItems = (ids: string[]) =>
  apiJson<{ results: Array<{ id: string; status: string; reason: string }> }>("/api/inventory/materials/bulk-deactivate", "POST", { ids });

export const fetchNextInventoryMaterialCode = (categoryId: string) =>
  apiGet<{ materialCode: string }>(`/api/inventory/materials/next-code?categoryId=${encodeURIComponent(categoryId)}`);

export const uploadInventoryItemImage = (id: string, file: File) => {
  const body = new FormData();
  body.append("image", file);
  return apiForm<InventoryItem>(`/api/inventory/materials/${id}/image`, "POST", body);
};

export const fetchInventoryCategories = (params: Record<string, string | number | boolean | undefined> = {}) =>
  apiGet<ListResponse<InventoryCategory>>(`/api/inventory/categories${buildQuery(params)}`);

export const saveInventoryCategory = (body: Record<string, unknown>, id?: string) =>
  id ? apiJson<InventoryCategory>(`/api/inventory/categories/${id}`, "PUT", body) : apiJson<InventoryCategory>("/api/inventory/categories", "POST", body);

export const deleteInventoryCategory = (id: string) => apiJson<InventoryCategory>(`/api/inventory/categories/${id}`, "DELETE");

export const fetchInventorySuppliers = (params: Record<string, string | number | boolean | undefined> = {}) =>
  apiGet<ListResponse<InventorySupplier>>(`/api/inventory/suppliers${buildQuery(params)}`);

export const saveInventorySupplier = (body: Record<string, unknown>, id?: string) =>
  id ? apiJson<InventorySupplier>(`/api/inventory/suppliers/${id}`, "PUT", body) : apiJson<InventorySupplier>("/api/inventory/suppliers", "POST", body);

export const deleteInventorySupplier = (id: string) => apiJson<InventorySupplier>(`/api/inventory/suppliers/${id}`, "DELETE");

export const fetchInventoryMovements = (params: Record<string, string | number | boolean | undefined> = {}) =>
  apiGet<ListResponse<InventoryStockMovement>>(`/api/inventory/movements${buildQuery(params)}`);

export const createInventoryMovement = (itemId: string, body: Record<string, unknown>) =>
  apiJson<InventoryStockMovement>(`/api/inventory/items/${itemId}/movements`, "POST", body);

export const fetchInventorySummary = () => apiGet<InventorySummary>("/api/inventory/reports/summary");
