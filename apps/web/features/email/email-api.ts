import { apiGet, apiJson } from "../../lib/api-client";
import type { EmailLog, EmailLogListResponse, EmailSetting, EmailTemplate } from "../../types/email";

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

export const fetchEmailSettings = () => apiGet<EmailSetting[]>("/api/email/settings");
export const saveEmailSettings = (body: Record<string, unknown>) => apiJson<EmailSetting>("/api/email/settings", "PUT", body);
export const sendTestEmail = (toEmail: string) => apiJson<EmailLog | undefined>("/api/email/settings/test", "POST", { toEmail });

export const fetchEmailTemplates = () => apiGet<EmailTemplate[]>("/api/email/templates");
export const updateEmailTemplate = (id: string, body: Record<string, unknown>) => apiJson<EmailTemplate>(`/api/email/templates/${id}`, "PUT", body);

export const fetchEmailLogs = (params: Record<string, string | number | undefined> = {}) => apiGet<EmailLogListResponse>(`/api/email/logs${buildQuery(params)}`);
export const retryEmailLog = (id: string) => apiJson<EmailLog>(`/api/email/logs/${id}/retry`, "POST");
