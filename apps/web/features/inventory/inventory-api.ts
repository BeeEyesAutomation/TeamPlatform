import { apiGet, apiJson } from "../../lib/api-client";
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
  apiGet<ListResponse<InventoryItem>>(`/api/inventory/items${buildQuery(params)}`);

export const fetchInventoryItem = (id: string) => apiGet<InventoryItem>(`/api/inventory/items/${id}`);

export const saveInventoryItem = (body: Record<string, unknown>, id?: string) =>
  id ? apiJson<InventoryItem>(`/api/inventory/items/${id}`, "PUT", body) : apiJson<InventoryItem>("/api/inventory/items", "POST", body);

export const deleteInventoryItem = (id: string) => apiJson<InventoryItem>(`/api/inventory/items/${id}`, "DELETE");

export const fetchInventoryCategories = (params: Record<string, string | number | boolean | undefined> = {}) =>
  apiGet<ListResponse<InventoryCategory>>(`/api/inventory/categories${buildQuery(params)}`);

export const saveInventoryCategory = (body: Record<string, unknown>, id?: string) =>
  id ? apiJson<InventoryCategory>(`/api/inventory/categories/${id}`, "PUT", body) : apiJson<InventoryCategory>("/api/inventory/categories", "POST", body);

export const fetchInventorySuppliers = (params: Record<string, string | number | boolean | undefined> = {}) =>
  apiGet<ListResponse<InventorySupplier>>(`/api/inventory/suppliers${buildQuery(params)}`);

export const saveInventorySupplier = (body: Record<string, unknown>, id?: string) =>
  id ? apiJson<InventorySupplier>(`/api/inventory/suppliers/${id}`, "PUT", body) : apiJson<InventorySupplier>("/api/inventory/suppliers", "POST", body);

export const fetchInventoryMovements = (params: Record<string, string | number | boolean | undefined> = {}) =>
  apiGet<ListResponse<InventoryStockMovement>>(`/api/inventory/movements${buildQuery(params)}`);

export const createInventoryMovement = (itemId: string, body: Record<string, unknown>) =>
  apiJson<InventoryStockMovement>(`/api/inventory/items/${itemId}/movements`, "POST", body);

export const fetchInventorySummary = () => apiGet<InventorySummary>("/api/inventory/reports/summary");
