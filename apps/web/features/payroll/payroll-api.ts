import { apiGet, apiJson } from "../../lib/api-client";
import type {
  AllowanceType,
  AllowanceTypeListResponse,
  Payroll,
  PayrollListResponse,
  TaxBracket,
  TaxBracketListResponse,
  TaxSetting,
  TaxSettingListResponse
} from "../../types/payroll";

const buildQuery = (params: Record<string, string | number | undefined> = {}) => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export function fetchTaxSettings(params: Record<string, string | number | undefined> = {}) {
  return apiGet<TaxSettingListResponse>(`/api/tax-settings${buildQuery(params)}`);
}

export function saveTaxSetting(body: Record<string, unknown>, id?: string) {
  return id ? apiJson<TaxSetting>(`/api/tax-settings/${id}`, "PUT", body) : apiJson<TaxSetting>("/api/tax-settings", "POST", body);
}

export function activateTaxSetting(id: string) {
  return apiJson<TaxSetting>(`/api/tax-settings/${id}/activate`, "POST");
}

export function fetchTaxBrackets(params: Record<string, string | number | undefined> = {}) {
  return apiGet<TaxBracketListResponse>(`/api/tax-brackets${buildQuery(params)}`);
}

export function saveTaxBracket(body: Record<string, unknown>, id?: string) {
  return id ? apiJson<TaxBracket>(`/api/tax-brackets/${id}`, "PUT", body) : apiJson<TaxBracket>("/api/tax-brackets", "POST", body);
}

export function deleteTaxBracket(id: string) {
  return apiJson<TaxBracket>(`/api/tax-brackets/${id}`, "DELETE");
}

export function fetchAllowanceTypes(params: Record<string, string | number | undefined> = {}) {
  return apiGet<AllowanceTypeListResponse>(`/api/allowance-types${buildQuery(params)}`);
}

export function saveAllowanceType(body: Record<string, unknown>, id?: string) {
  return id ? apiJson<AllowanceType>(`/api/allowance-types/${id}`, "PUT", body) : apiJson<AllowanceType>("/api/allowance-types", "POST", body);
}

export function deleteAllowanceType(id: string) {
  return apiJson<AllowanceType>(`/api/allowance-types/${id}`, "DELETE");
}

export function fetchPayrolls(params: Record<string, string | number | undefined> = {}) {
  return apiGet<PayrollListResponse>(`/api/payrolls${buildQuery(params)}`);
}

export function calculatePayroll(month: string) {
  return apiJson<PayrollListResponse>("/api/payrolls/calculate", "POST", { month });
}

export function fetchPayroll(id: string) {
  return apiGet<Payroll>(`/api/payrolls/${id}`);
}

export function approvePayroll(id: string) {
  return apiJson<Payroll>(`/api/payrolls/${id}/approve`, "POST");
}

export function publishPayroll(id: string) {
  return apiJson<Payroll>(`/api/payrolls/${id}/publish`, "POST");
}

export function lockPayroll(id: string) {
  return apiJson<Payroll>(`/api/payrolls/${id}/lock`, "POST");
}

export function fetchMyPayslip(month: string) {
  return apiGet<Payroll>(`/api/payslips/me${buildQuery({ month })}`);
}

