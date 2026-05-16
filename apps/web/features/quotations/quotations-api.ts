import { apiBaseUrl, apiForm, apiGet, apiJson, getStoredAccessToken } from "../../lib/api-client";
import type {
  ListResponse,
  Quotation,
  QuotationCompanySettings,
  QuotationImage,
  QuotationPreview,
  QuotationTemplate,
  QuotationTemplateVersion,
  QuotationVersion
} from "../../types/quotations";

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

export const fetchQuotationVersions = (id: string) => apiGet<QuotationVersion[]>(`/api/quotations/${id}/versions`);

export const fetchQuotationVersion = (id: string, versionId: string) => apiGet<QuotationVersion>(`/api/quotations/${id}/versions/${versionId}`);

export const createQuotationUpdateFromVersion = (id: string, versionId: string, body: Record<string, unknown>) =>
  apiJson<Quotation>(`/api/quotations/${id}/versions/${versionId}/create-update`, "POST", body);

export const fetchQuotationPreview = (id: string, versionId?: string) =>
  apiGet<QuotationPreview>(versionId ? `/api/quotations/${id}/versions/${versionId}/preview` : `/api/quotations/${id}/preview`);

export const approveQuotationVersion = (id: string, versionId: string) =>
  apiJson<QuotationVersion>(`/api/quotations/${id}/versions/${versionId}/approve`, "POST");

export const rejectQuotationVersion = (id: string, versionId: string) =>
  apiJson<QuotationVersion>(`/api/quotations/${id}/versions/${versionId}/reject`, "POST");

export const cancelQuotationVersion = (id: string, versionId: string) =>
  apiJson<QuotationVersion>(`/api/quotations/${id}/versions/${versionId}/cancel`, "POST");

export const createQuotationStockOut = (id: string, versionId: string) =>
  apiJson<{ stockOutCreatedAt: string }>(`/api/quotations/${id}/versions/${versionId}/stock-out`, "POST");

export const syncQuotationProjectMaterials = (id: string, versionId: string) =>
  apiJson<{ count: number }>(`/api/quotations/${id}/versions/${versionId}/sync-project-materials`, "POST");

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

export const uploadCustomerPo = (id: string, versionId: string, file: File) => {
  const body = new FormData();
  body.append("customerPo", file);
  return apiForm<QuotationVersion>(`/api/quotations/${id}/versions/${versionId}/customer-po`, "POST", body);
};

export const fetchQuotationCompanySettings = () => apiGet<QuotationCompanySettings | null>("/api/quotation-settings/company");

export const saveQuotationCompanySettings = (body: Record<string, unknown>) =>
  apiJson<QuotationCompanySettings>("/api/quotation-settings/company", "PUT", body);

export const fetchQuotationTemplates = (params: Record<string, string | number | boolean | undefined> = {}) =>
  apiGet<ListResponse<QuotationTemplate>>(`/api/quotation-templates${buildQuery(params)}`);

export const fetchQuotationTemplate = (id: string) => apiGet<QuotationTemplate>(`/api/quotation-templates/${id}`);

export const uploadQuotationTemplate = (file: File, name?: string) => {
  const body = new FormData();
  body.append("template", file);
  if (name) body.append("name", name);
  return apiForm<QuotationTemplate>("/api/quotation-templates/upload", "POST", body);
};

export const updateQuotationTemplate = (id: string, body: Record<string, unknown>) =>
  apiJson<QuotationTemplate>(`/api/quotation-templates/${id}`, "PUT", body);

export const updateQuotationTemplateMapping = (id: string, placeholderConfig: Record<string, string>) =>
  apiJson<QuotationTemplate>(`/api/quotation-templates/${id}/mapping`, "PUT", { placeholderConfig });

export const setDefaultQuotationTemplate = (id: string) =>
  apiJson<QuotationTemplate>(`/api/quotation-templates/${id}/set-default`, "POST");

export const deleteQuotationTemplate = (id: string) => apiJson<QuotationTemplate>(`/api/quotation-templates/${id}`, "DELETE");

export const fetchQuotationTemplateVersions = (templateId: string) =>
  apiGet<QuotationTemplateVersion[]>(`/api/quotation-templates/${templateId}/versions`);

export const createQuotationTemplateVersion = (templateId: string, body: Record<string, unknown> = {}) =>
  apiJson<QuotationTemplateVersion>(`/api/quotation-templates/${templateId}/versions`, "POST", body);

export const fetchQuotationTemplateVersion = (id: string) => apiGet<QuotationTemplateVersion>(`/api/quotation-template-versions/${id}`);

export const updateQuotationTemplateVersionLayout = (id: string, body: unknown) =>
  apiJson<QuotationTemplateVersion>(`/api/quotation-template-versions/${id}/layout`, "PUT", body);

export const updateQuotationTemplateVersionTableConfig = (id: string, tableConfig: unknown) =>
  apiJson<QuotationTemplateVersion>(`/api/quotation-template-versions/${id}/table-config`, "PUT", { tableConfig });

export const duplicateQuotationTemplateVersion = (id: string) =>
  apiJson<QuotationTemplateVersion>(`/api/quotation-template-versions/${id}/duplicate`, "POST");

export const setDefaultQuotationTemplateVersion = (templateId: string, versionId: string) =>
  apiJson<{ template: QuotationTemplate; version: QuotationTemplateVersion }>(`/api/quotation-templates/${templateId}/set-default-version`, "POST", { versionId });

export const restoreQuotationTemplateVersion = (id: string) =>
  apiJson<{ template: QuotationTemplate; version: QuotationTemplateVersion }>(`/api/quotation-template-versions/${id}/restore`, "POST");

export async function downloadQuotationExcel(id: string, quotationCode: string, versionId?: string) {
  const token = getStoredAccessToken();
  const path = versionId ? `/api/quotations/${id}/versions/${versionId}/export/excel` : `/api/quotations/${id}/export/excel`;
  const response = await fetch(`${apiBaseUrl}${path}`, {
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
