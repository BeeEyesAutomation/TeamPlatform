import { apiBaseUrl, apiForm, apiGet, apiJson, getStoredAccessToken } from "../../lib/api-client";
import type { ListResponse, Quotation, QuotationImage } from "../../types/quotations";

const buildQuery = (params: Record<string, string | number | boolean | undefined> = {}) => {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const fetchQuotations = (params: Record<string, string | number | boolean | undefined> = {}) =>
  apiGet<ListResponse<Quotation>>(`/api/quotations${buildQuery(params)}`);

export const fetchQuotation = (id: string) => apiGet<Quotation>(`/api/quotations/${id}`);

export const saveQuotation = (body: Record<string, unknown>, id?: string) =>
  id ? apiJson<Quotation>(`/api/quotations/${id}`, "PUT", body) : apiJson<Quotation>("/api/quotations", "POST", body);

export const deleteQuotation = (id: string) => apiJson<Quotation>(`/api/quotations/${id}`, "DELETE");

export const fetchNextQuotationCode = (date: string) => apiGet<{ quotationCode: string }>(`/api/quotations/next-code${buildQuery({ date })}`);

export const uploadQuotationImage = (id: string, file: File) => {
  const body = new FormData();
  body.append("image", file);
  return apiForm<QuotationImage>(`/api/quotations/${id}/images`, "POST", body);
};

export const uploadQuotationSignature = (id: string, file: File) => {
  const body = new FormData();
  body.append("signature", file);
  return apiForm<Quotation>(`/api/quotations/${id}/signature`, "POST", body);
};

export async function downloadQuotationExcel(id: string, quotationCode: string) {
  const token = getStoredAccessToken();
  const response = await fetch(`${apiBaseUrl}/api/quotations/${id}/export/excel`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) {
    let message = `Export failed with status ${response.status}`;
    try {
      const payload = await response.json();
      if (typeof payload?.message === "string") message = payload.message;
    } catch {
      // Keep fallback for non-JSON export errors.
    }
    throw new Error(message);
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `quotation-${quotationCode}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
