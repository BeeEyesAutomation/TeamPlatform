import { apiGet } from "../../lib/api-client";

export const fetchHrOverview = () => apiGet<Record<string, unknown>>("/api/statistics/hr/overview");
export const fetchPayrollOverview = () => apiGet<Record<string, unknown>>("/api/statistics/payroll/overview");
export const fetchProjectOverview = () => apiGet<Record<string, unknown>>("/api/statistics/projects/overview");
export const fetchIssueStatistics = () => apiGet<Array<Record<string, unknown>>>("/api/statistics/projects/issues");
export const fetchMaterialStatistics = () => apiGet<Array<Record<string, unknown>>>("/api/statistics/projects/materials");
export const fetchCostStatistics = () => apiGet<Array<Record<string, unknown>>>("/api/statistics/projects/costs");
