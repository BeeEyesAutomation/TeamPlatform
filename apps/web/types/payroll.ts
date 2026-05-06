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

export type PayrollStatus = "draft" | "finalized" | "published" | "locked";

export interface PayrollItem {
  id: string;
  payrollId: string;
  allowanceTypeId?: string | null;
  name: string;
  code: string;
  type: string;
  amount: string | number;
  isTaxable: boolean;
  isInsuranceBased: boolean;
  note?: string | null;
}

export interface Payroll {
  id: string;
  employeeId: string;
  month: string;
  positionSalary: string | number;
  totalAllowances: string | number;
  totalBonuses: string | number;
  totalDeductions: string | number;
  insuranceBase: string | number;
  socialInsurance: string | number;
  healthInsurance: string | number;
  unemploymentInsurance: string | number;
  taxableIncome: string | number;
  personalDeduction: string | number;
  dependentDeduction: string | number;
  taxableIncomeAfterDeduction: string | number;
  personalIncomeTax: string | number;
  salaryAdvance: string | number;
  netSalary: string | number;
  status: PayrollStatus;
  employee?: {
    id: string;
    employeeCode: string;
    fullName: string;
    email?: string | null;
    department?: { id: string; code: string; name: string } | null;
    position?: { id: string; code: string; name: string } | null;
  };
  payrollItems?: PayrollItem[];
}

export type TaxSettingListResponse = ListResponse<TaxSetting>;
export type TaxBracketListResponse = ListResponse<TaxBracket>;
export type AllowanceTypeListResponse = ListResponse<AllowanceType>;
export type PayrollListResponse = ListResponse<Payroll>;
