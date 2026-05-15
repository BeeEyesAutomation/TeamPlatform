import { apiGet, apiJson, getStoredAccessToken } from "../../lib/api-client";
import type { ExportLog, ImportLog, ImportPreviewRow, ListResponse } from "../../types/import-export";

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

export const previewImport = (type: string, body: Record<string, unknown>) => apiJson<{ log: ImportLog; rows: ImportPreviewRow[] }>(`/api/imports/${type}`, "POST", body);
export async function uploadImportFile(type: string, formData: FormData) {
  const token = getStoredAccessToken();
  const response = await fetch(`${apiBaseUrl}/api/imports/${type}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Import upload failed with status ${response.status}`);
  }

  return response.json() as Promise<{ status: "ok"; data: { log: ImportLog; rows: ImportPreviewRow[] } }>;
}
export const fetchImportLogs = () => apiGet<ListResponse<ImportLog>>("/api/imports/logs?pageSize=100");
export const fetchExportLogs = () => apiGet<ListResponse<ExportLog>>("/api/exports/logs?pageSize=100");
