import { apiGet, apiJson } from "../../lib/api-client";
import type { ExportLog, ImportLog, ListResponse } from "../../types/import-export";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const importTemplateUrl = (type: string) => `${apiBaseUrl}/api/imports/templates/${type}`;
export const exportUrl = (type: string, params: Record<string, string | number | undefined> = {}) => `${apiBaseUrl}/api/exports/${type}${buildQuery(params)}`;

export const previewImport = (type: string, body: Record<string, unknown>) => apiJson<{ log: ImportLog; rows: unknown[] }>(`/api/imports/${type}`, "POST", body);
export const fetchImportLogs = () => apiGet<ListResponse<ImportLog>>("/api/imports/logs?pageSize=100");
export const fetchExportLogs = () => apiGet<ListResponse<ExportLog>>("/api/exports/logs?pageSize=100");
