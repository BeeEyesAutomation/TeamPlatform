import { describe, expect, it } from "vitest";

import { calculatePayroll, calculatePositionSalary, calculateProgressiveTax, type PayrollCalculationInput } from "./payroll.calculator.js";

const taxBrackets = [
  { level: 1, incomeFrom: 0, incomeTo: 5_000_000, taxRate: 5 },
  { level: 2, incomeFrom: 5_000_000, incomeTo: 10_000_000, taxRate: 10 },
  { level: 3, incomeFrom: 10_000_000, incomeTo: null, taxRate: 20 }
];

function baseInput(overrides: Partial<PayrollCalculationInput> = {}): PayrollCalculationInput {
  return {
    employeeId: "employee-1",
    employeeCode: "EMP001",
    employeeName: "Nguyen Van A",
    dependentCount: 0,
    baseSalary: 10_000_000,
    salaryStepAmount: 1_000_000,
    salaryLevel: 2,
    workingDays: 20,
    presentDays: 18,
    paidLeaveDays: 1,
    unpaidLeaveDays: 1,
    attendancePercent: 90,
    salaryAdvance: 0,
    allowanceTypes: [],
    taxSetting: {
      personalDeduction: 0,
      dependentDeduction: 0,
      socialInsuranceRate: 8,
      healthInsuranceRate: 1.5,
      unemploymentInsuranceRate: 1,
      taxBrackets
    },
    ...overrides
  };
}

describe("payroll calculator", () => {
  it("calculates position salary from base salary, step amount, and salary level", () => {
    expect(calculatePositionSalary(10_000_000, 1_000_000, 2).toNumber()).toBe(12_000_000);
  });

  it("calculates per-working-day and attendance-rate allowances", () => {
    const payroll = calculatePayroll(baseInput({
      allowanceTypes: [
        {
          code: "MEAL",
          name: "Meal allowance",
          calculationType: "per_working_day",
          amount: 50_000,
          isTaxable: false,
          isInsuranceBased: false
        },
        {
          code: "ATTENDANCE",
          name: "Attendance bonus",
          calculationType: "attendance_rate",
          amount: 1_000_000,
          isTaxable: true,
          isInsuranceBased: false,
          metadata: { minAttendancePercent: 80 }
        }
      ]
    }));

    expect(payroll.items.find((item) => item.code === "MEAL")?.amount.toNumber()).toBe(900_000);
    expect(payroll.items.find((item) => item.code === "ATTENDANCE")?.amount.toNumber()).toBe(1_000_000);
    expect(payroll.totalAllowances.toNumber()).toBe(1_900_000);
  });

  it("keeps taxable and insurance-based item rules separate", () => {
    const payroll = calculatePayroll(baseInput({
      allowanceTypes: [
        {
          code: "TAXABLE_ONLY",
          name: "Taxable only",
          calculationType: "fixed_monthly",
          amount: 2_000_000,
          isTaxable: true,
          isInsuranceBased: false
        },
        {
          code: "INSURANCE_ONLY",
          name: "Insurance only",
          calculationType: "fixed_monthly",
          amount: 3_000_000,
          isTaxable: false,
          isInsuranceBased: true
        }
      ]
    }));

    expect(payroll.taxableIncome.toNumber()).toBe(14_000_000);
    expect(payroll.insuranceBase.toNumber()).toBe(15_000_000);
  });

  it("calculates progressive tax brackets", () => {
    expect(calculateProgressiveTax(12_000_000, taxBrackets).toNumber()).toBe(1_150_000);
  });

  it("calculates net salary from gross items, deductions, insurance, tax, and advances", () => {
    const payroll = calculatePayroll(baseInput({
      salaryAdvance: 500_000,
      allowanceTypes: [
        {
          code: "MEAL",
          name: "Meal allowance",
          calculationType: "per_working_day",
          amount: 50_000,
          isTaxable: false,
          isInsuranceBased: false
        },
        {
          code: "ATTENDANCE",
          name: "Attendance bonus",
          calculationType: "attendance_rate",
          amount: 1_000_000,
          isTaxable: true,
          isInsuranceBased: false,
          metadata: { minAttendancePercent: 80 }
        },
        {
          code: "DISCIPLINE",
          name: "Discipline deduction",
          calculationType: "deduction",
          amount: 200_000,
          isTaxable: true,
          isInsuranceBased: false
        }
      ],
      taxSetting: {
        personalDeduction: 1_000_000,
        dependentDeduction: 0,
        socialInsuranceRate: 8,
        healthInsuranceRate: 1.5,
        unemploymentInsuranceRate: 1,
        taxBrackets
      }
    }));

    expect(payroll.totalAllowances.toNumber()).toBe(1_900_000);
    expect(payroll.totalDeductions.toNumber()).toBe(200_000);
    expect(payroll.insuranceBase.toNumber()).toBe(12_000_000);
    expect(payroll.personalIncomeTax.toNumber()).toBe(1_110_000);
    expect(payroll.netSalary.toNumber()).toBe(10_830_000);
  });
});
