import { Prisma } from "@prisma/client";

export type DecimalValue = Prisma.Decimal | string | number;

export interface PayrollAllowanceInput {
  id?: string | null;
  code: string;
  name: string;
  calculationType: "fixed_monthly" | "per_working_day" | "attendance_rate" | "manual_bonus" | "project_bonus" | "deduction";
  amount: DecimalValue;
  isTaxable: boolean;
  isInsuranceBased: boolean;
  metadata?: unknown;
}

export interface PayrollTaxBracketInput {
  level: number;
  incomeFrom: DecimalValue;
  incomeTo?: DecimalValue | null;
  taxRate: DecimalValue;
}

export interface PayrollTaxSettingInput {
  personalDeduction: DecimalValue;
  dependentDeduction: DecimalValue;
  socialInsuranceRate: DecimalValue;
  healthInsuranceRate: DecimalValue;
  unemploymentInsuranceRate: DecimalValue;
  taxBrackets: PayrollTaxBracketInput[];
}

export interface PayrollCalculationInput {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  dependentCount: number;
  baseSalary: DecimalValue;
  salaryStepAmount: DecimalValue;
  salaryLevel: number;
  workingDays: number;
  presentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  attendancePercent: DecimalValue;
  allowanceTypes: PayrollAllowanceInput[];
  salaryAdvance?: DecimalValue;
  taxSetting: PayrollTaxSettingInput;
}

export interface CalculatedPayrollItem {
  allowanceTypeId?: string | null;
  name: string;
  code: string;
  type: string;
  amount: Prisma.Decimal;
  isTaxable: boolean;
  isInsuranceBased: boolean;
  note?: string;
  metadata?: Record<string, unknown>;
}

export interface CalculatedPayroll {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  positionSalary: Prisma.Decimal;
  totalAllowances: Prisma.Decimal;
  totalBonuses: Prisma.Decimal;
  totalDeductions: Prisma.Decimal;
  insuranceBase: Prisma.Decimal;
  socialInsurance: Prisma.Decimal;
  healthInsurance: Prisma.Decimal;
  unemploymentInsurance: Prisma.Decimal;
  taxableIncome: Prisma.Decimal;
  personalDeduction: Prisma.Decimal;
  dependentDeduction: Prisma.Decimal;
  taxableIncomeAfterDeduction: Prisma.Decimal;
  personalIncomeTax: Prisma.Decimal;
  salaryAdvance: Prisma.Decimal;
  netSalary: Prisma.Decimal;
  items: CalculatedPayrollItem[];
}

const ZERO = new Prisma.Decimal(0);
const ONE_HUNDRED = new Prisma.Decimal(100);

export function decimal(value: DecimalValue | null | undefined) {
  return value === null || value === undefined ? ZERO : new Prisma.Decimal(value);
}

export function calculatePositionSalary(baseSalary: DecimalValue, salaryStepAmount: DecimalValue, salaryLevel: number) {
  return decimal(baseSalary).plus(decimal(salaryStepAmount).mul(salaryLevel));
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function thresholdFromMetadata(value: unknown) {
  const metadata = metadataRecord(value);
  const threshold = metadata.minAttendancePercent;

  if (threshold === undefined || threshold === null || threshold === "") {
    return undefined;
  }

  const parsed = Number(threshold);
  return Number.isFinite(parsed) ? new Prisma.Decimal(parsed) : undefined;
}

function itemBucket(type: PayrollAllowanceInput["calculationType"]) {
  if (type === "manual_bonus" || type === "project_bonus") {
    return "bonus";
  }

  if (type === "deduction") {
    return "deduction";
  }

  return "allowance";
}

export function calculateProgressiveTax(taxableIncomeAfterDeduction: DecimalValue, brackets: PayrollTaxBracketInput[]) {
  const income = decimal(taxableIncomeAfterDeduction);
  if (income.lte(0)) {
    return ZERO;
  }

  return brackets
    .slice()
    .sort((left, right) => left.level - right.level)
    .reduce((tax, bracket) => {
      const from = decimal(bracket.incomeFrom);
      const to = bracket.incomeTo === null || bracket.incomeTo === undefined ? undefined : decimal(bracket.incomeTo);
      const rate = decimal(bracket.taxRate).div(ONE_HUNDRED);

      if (income.lte(from)) {
        return tax;
      }

      const upper = to && income.gt(to) ? to : income;
      const taxableInBracket = upper.minus(from);
      return taxableInBracket.lte(0) ? tax : tax.plus(taxableInBracket.mul(rate));
    }, ZERO);
}

export function calculatePayroll(input: PayrollCalculationInput): CalculatedPayroll {
  const positionSalary = calculatePositionSalary(input.baseSalary, input.salaryStepAmount, input.salaryLevel);
  const attendancePercent = decimal(input.attendancePercent);
  const salaryAdvance = decimal(input.salaryAdvance);
  const items: CalculatedPayrollItem[] = [
    {
      name: "Position salary",
      code: "POSITION_SALARY",
      type: "salary",
      amount: positionSalary,
      isTaxable: true,
      isInsuranceBased: true,
      metadata: {
        baseSalary: decimal(input.baseSalary).toString(),
        salaryStepAmount: decimal(input.salaryStepAmount).toString(),
        salaryLevel: input.salaryLevel
      }
    }
  ];

  for (const allowance of input.allowanceTypes) {
    let amount = ZERO;
    let note: string | undefined;

    if (allowance.calculationType === "fixed_monthly" || allowance.calculationType === "manual_bonus" || allowance.calculationType === "project_bonus" || allowance.calculationType === "deduction") {
      amount = decimal(allowance.amount);
    }

    if (allowance.calculationType === "per_working_day") {
      amount = decimal(allowance.amount).mul(input.presentDays);
      note = `${input.presentDays} present days`;
    }

    if (allowance.calculationType === "attendance_rate") {
      const threshold = thresholdFromMetadata(allowance.metadata);
      if (!threshold || attendancePercent.gte(threshold)) {
        amount = decimal(allowance.amount);
        note = threshold ? `Attendance ${attendancePercent.toString()}% >= ${threshold.toString()}%` : undefined;
      }
    }

    if (amount.lte(0)) {
      continue;
    }

    items.push({
      allowanceTypeId: allowance.id,
      name: allowance.name,
      code: allowance.code,
      type: itemBucket(allowance.calculationType),
      amount,
      isTaxable: allowance.isTaxable,
      isInsuranceBased: allowance.isInsuranceBased,
      note,
      metadata: metadataRecord(allowance.metadata)
    });
  }

  const positiveItems = items.filter((item) => item.type !== "deduction");
  const deductionItems = items.filter((item) => item.type === "deduction");
  const totalAllowances = items
    .filter((item) => item.type === "allowance")
    .reduce((total, item) => total.plus(item.amount), ZERO);
  const totalBonuses = items
    .filter((item) => item.type === "bonus")
    .reduce((total, item) => total.plus(item.amount), ZERO);
  const totalDeductions = deductionItems.reduce((total, item) => total.plus(item.amount), ZERO);
  const insuranceBase = positiveItems
    .filter((item) => item.isInsuranceBased)
    .reduce((total, item) => total.plus(item.amount), ZERO);
  const taxableIncome = positiveItems
    .filter((item) => item.isTaxable)
    .reduce((total, item) => total.plus(item.amount), ZERO)
    .minus(deductionItems.filter((item) => item.isTaxable).reduce((total, item) => total.plus(item.amount), ZERO));
  const personalDeduction = decimal(input.taxSetting.personalDeduction);
  const dependentDeduction = decimal(input.taxSetting.dependentDeduction).mul(input.dependentCount);
  const taxableIncomeAfterDeduction = Prisma.Decimal.max(taxableIncome.minus(personalDeduction).minus(dependentDeduction), ZERO);
  const socialInsurance = insuranceBase.mul(decimal(input.taxSetting.socialInsuranceRate)).div(ONE_HUNDRED);
  const healthInsurance = insuranceBase.mul(decimal(input.taxSetting.healthInsuranceRate)).div(ONE_HUNDRED);
  const unemploymentInsurance = insuranceBase.mul(decimal(input.taxSetting.unemploymentInsuranceRate)).div(ONE_HUNDRED);
  const personalIncomeTax = calculateProgressiveTax(taxableIncomeAfterDeduction, input.taxSetting.taxBrackets);
  const insuranceTotal = socialInsurance.plus(healthInsurance).plus(unemploymentInsurance);
  const netSalary = positionSalary
    .plus(totalAllowances)
    .plus(totalBonuses)
    .minus(totalDeductions)
    .minus(insuranceTotal)
    .minus(personalIncomeTax)
    .minus(salaryAdvance);

  return {
    employeeId: input.employeeId,
    employeeCode: input.employeeCode,
    employeeName: input.employeeName,
    positionSalary,
    totalAllowances,
    totalBonuses,
    totalDeductions,
    insuranceBase,
    socialInsurance,
    healthInsurance,
    unemploymentInsurance,
    taxableIncome,
    personalDeduction,
    dependentDeduction,
    taxableIncomeAfterDeduction,
    personalIncomeTax,
    salaryAdvance,
    netSalary,
    items
  };
}
