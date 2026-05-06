import type { ListResponse, RecordStatus } from "./hr";

export type AllowanceCalculationType =
  | "fixed_monthly"
  | "per_working_day"
  | "attendance_rate"
  | "manual_bonus"
  | "project_bonus"
  | "deduction";

export type ApplyScope = "company" | "department" | "position" | "employee";

export interface TaxBracket {
  id: string;
  taxSettingId: string;
  level: number;
  incomeFrom: string | number;
  incomeTo?: string | number | null;
  taxRate: string | number;
}

export interface TaxSetting {
  id: string;
  personalDeduction: string | number;
  dependentDeduction: string | number;
  socialInsuranceRate: string | number;
  healthInsuranceRate: string | number;
  unemploymentInsuranceRate: string | number;
  effectiveFrom: string;
  status: RecordStatus;
  taxBrackets?: TaxBracket[];
}

export interface AllowanceType {
  id: string;
  name: string;
  code: string;
  calculationType: AllowanceCalculationType;
  amount: string | number;
  unit?: string | null;
  isTaxable: boolean;
  isInsuranceBased: boolean;
  applyScope: ApplyScope;
  status: RecordStatus;
}

export type TaxSettingListResponse = ListResponse<TaxSetting>;
export type TaxBracketListResponse = ListResponse<TaxBracket>;
export type AllowanceTypeListResponse = ListResponse<AllowanceType>;

