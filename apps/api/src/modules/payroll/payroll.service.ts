import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { AppError } from "../../utils/app-error";
import { createAuditLog } from "../audit/audit.service";
import { getMonthRange } from "../attendance/attendance.utils";
import { enqueueEmail } from "../email/email.service";
import { getPagination, getPaginationMeta } from "../hr/hr.utils";
import { calculatePayroll, decimal, type PayrollAllowanceInput } from "./payroll.calculator";
import type { z } from "zod";
import type { payrollCalculateSchema, payrollQuerySchema } from "./payroll.schemas";

type PayrollCalculateInput = z.infer<typeof payrollCalculateSchema>;
type PayrollQueryInput = z.infer<typeof payrollQuerySchema>;

interface RequestContext {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
}

const payrollInclude = {
  employee: {
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      email: true,
      department: {
        select: {
          id: true,
          code: true,
          name: true
        }
      },
      position: {
        select: {
          id: true,
          code: true,
          name: true
        }
      }
    }
  },
  payrollItems: {
    orderBy: {
      createdAt: "asc" as const
    }
  }
};

function roundMoney(value: Prisma.Decimal) {
  return value.toDecimalPlaces(0);
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function jsonMetadata(value: Record<string, unknown> | undefined) {
  return value as Prisma.InputJsonValue | undefined;
}

async function getActiveTaxSetting(month: string) {
  const { end } = getMonthRange(month);
  const taxSetting = await prisma.taxSetting.findFirst({
    where: {
      status: "active",
      effectiveFrom: {
        lt: end
      }
    },
    include: {
      taxBrackets: {
        orderBy: {
          level: "asc"
        }
      }
    },
    orderBy: {
      effectiveFrom: "desc"
    }
  });

  if (!taxSetting) {
    throw new AppError(400, "No active tax setting found for payroll month");
  }

  if (taxSetting.taxBrackets.length === 0) {
    throw new AppError(400, "Active tax setting has no tax brackets");
  }

  return taxSetting;
}

async function getAttendanceSummary(month: string, employeeIds: string[]) {
  const { start, end } = getMonthRange(month);
  const records = await prisma.attendanceRecord.findMany({
    where: {
      date: {
        gte: start,
        lt: end
      }
    }
  });
  const workingDates = Array.from(new Set(records.map((record) => dateKey(record.date))));
  const recordByEmployeeAndDate = new Map(records.map((record) => [`${record.employeeId}:${dateKey(record.date)}`, record]));

  return new Map(
    employeeIds.map((employeeId) => {
      let presentDays = 0;
      let paidLeaveDays = 0;
      let unpaidLeaveDays = 0;

      for (const workingDate of workingDates) {
        const status = recordByEmployeeAndDate.get(`${employeeId}:${workingDate}`)?.status ?? "present";
        if (status === "present") {
          presentDays += 1;
        }
        if (status === "leave_paid") {
          paidLeaveDays += 1;
        }
        if (status === "leave_unpaid") {
          unpaidLeaveDays += 1;
        }
      }

      const workingDays = workingDates.length;
      const attendancePercent = workingDays === 0 ? 0 : Math.round((presentDays / workingDays) * 10000) / 100;

      return [
        employeeId,
        {
          workingDays,
          presentDays,
          paidLeaveDays,
          unpaidLeaveDays,
          attendancePercent
        }
      ];
    })
  );
}

async function getConfiguredAllowanceTypes() {
  const allowanceTypes = await prisma.allowanceType.findMany({
    where: {
      status: "active",
      deletedAt: null,
      applyScope: "company"
    },
    orderBy: {
      code: "asc"
    }
  });

  return allowanceTypes.map((allowanceType): PayrollAllowanceInput => ({
    id: allowanceType.id,
    code: allowanceType.code,
    name: allowanceType.name,
    calculationType: allowanceType.calculationType,
    amount: allowanceType.amount,
    isTaxable: allowanceType.isTaxable,
    isInsuranceBased: allowanceType.isInsuranceBased,
    metadata: allowanceType.metadata
  }));
}

export async function calculatePayrollForMonth(input: PayrollCalculateInput, context: RequestContext) {
  const [taxSetting, allowanceTypes, employees] = await Promise.all([
    getActiveTaxSetting(input.month),
    getConfiguredAllowanceTypes(),
    prisma.employee.findMany({
      where: {
        deletedAt: null,
        status: "active",
        ...(input.employeeId ? { id: input.employeeId } : {}),
        positionId: {
          not: null
        }
      },
      include: {
        position: true
      },
      orderBy: {
        fullName: "asc"
      }
    })
  ]);

  const employeeIds = employees.map((employee) => employee.id);
  const attendanceByEmployeeId = await getAttendanceSummary(input.month, employeeIds);
  const calculatedPayrolls = employees.map((employee) => {
    if (!employee.position) {
      throw new AppError(400, `Employee ${employee.employeeCode} has no position`);
    }

    const attendance = attendanceByEmployeeId.get(employee.id) ?? {
      workingDays: 0,
      presentDays: 0,
      paidLeaveDays: 0,
      unpaidLeaveDays: 0,
      attendancePercent: 0
    };

    return calculatePayroll({
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      employeeName: employee.fullName,
      dependentCount: employee.dependentCount,
      baseSalary: employee.position.baseSalary,
      salaryStepAmount: employee.position.salaryStepAmount,
      salaryLevel: employee.salaryLevel,
      ...attendance,
      allowanceTypes,
      salaryAdvance: 0,
      taxSetting
    });
  });

  const saved = await prisma.$transaction(async (tx) => {
    const results = [];

    for (const payroll of calculatedPayrolls) {
      const existing = await tx.payroll.findUnique({
        where: {
          employeeId_month: {
            employeeId: payroll.employeeId,
            month: input.month
          }
        }
      });

      if (existing?.status === "locked" || existing?.status === "published") {
        results.push(existing);
        continue;
      }

      const savedPayroll = await tx.payroll.upsert({
        where: {
          employeeId_month: {
            employeeId: payroll.employeeId,
            month: input.month
          }
        },
        update: {
          positionSalary: roundMoney(payroll.positionSalary),
          totalAllowances: roundMoney(payroll.totalAllowances),
          totalBonuses: roundMoney(payroll.totalBonuses),
          totalDeductions: roundMoney(payroll.totalDeductions),
          insuranceBase: roundMoney(payroll.insuranceBase),
          socialInsurance: roundMoney(payroll.socialInsurance),
          healthInsurance: roundMoney(payroll.healthInsurance),
          unemploymentInsurance: roundMoney(payroll.unemploymentInsurance),
          taxableIncome: roundMoney(payroll.taxableIncome),
          personalDeduction: roundMoney(payroll.personalDeduction),
          dependentDeduction: roundMoney(payroll.dependentDeduction),
          taxableIncomeAfterDeduction: roundMoney(payroll.taxableIncomeAfterDeduction),
          personalIncomeTax: roundMoney(payroll.personalIncomeTax),
          salaryAdvance: roundMoney(payroll.salaryAdvance),
          netSalary: roundMoney(payroll.netSalary),
          status: "draft",
          calculatedById: context.actorId,
          finalizedById: null,
          finalizedAt: null,
          metadata: {
            employeeCode: payroll.employeeCode,
            employeeName: payroll.employeeName
          }
        },
        create: {
          employeeId: payroll.employeeId,
          month: input.month,
          positionSalary: roundMoney(payroll.positionSalary),
          totalAllowances: roundMoney(payroll.totalAllowances),
          totalBonuses: roundMoney(payroll.totalBonuses),
          totalDeductions: roundMoney(payroll.totalDeductions),
          insuranceBase: roundMoney(payroll.insuranceBase),
          socialInsurance: roundMoney(payroll.socialInsurance),
          healthInsurance: roundMoney(payroll.healthInsurance),
          unemploymentInsurance: roundMoney(payroll.unemploymentInsurance),
          taxableIncome: roundMoney(payroll.taxableIncome),
          personalDeduction: roundMoney(payroll.personalDeduction),
          dependentDeduction: roundMoney(payroll.dependentDeduction),
          taxableIncomeAfterDeduction: roundMoney(payroll.taxableIncomeAfterDeduction),
          personalIncomeTax: roundMoney(payroll.personalIncomeTax),
          salaryAdvance: roundMoney(payroll.salaryAdvance),
          netSalary: roundMoney(payroll.netSalary),
          status: "draft",
          calculatedById: context.actorId,
          metadata: {
            employeeCode: payroll.employeeCode,
            employeeName: payroll.employeeName
          }
        }
      });

      await tx.payrollItem.deleteMany({
        where: {
          payrollId: savedPayroll.id
        }
      });

      await tx.payrollItem.createMany({
        data: payroll.items.map((item) => ({
          payrollId: savedPayroll.id,
          allowanceTypeId: item.allowanceTypeId ?? null,
          name: item.name,
          code: item.code,
          type: item.type,
          amount: roundMoney(item.amount),
          isTaxable: item.isTaxable,
          isInsuranceBased: item.isInsuranceBased,
          note: item.note,
          metadata: jsonMetadata(item.metadata)
        }))
      });

      results.push(savedPayroll);
    }

    return results;
  });

  await createAuditLog({
    actorId: context.actorId,
    action: "calculate",
    module: "payroll",
    targetType: "payroll_month",
    targetId: input.month,
    newValue: {
      month: input.month,
      employeeId: input.employeeId,
      calculatedCount: saved.length
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return listPayrolls({
    month: input.month,
    employeeId: input.employeeId,
    page: 1,
    pageSize: 100
  });
}

export async function listPayrolls(query: PayrollQueryInput) {
  const pagination = getPagination(query);
  const where = {
    month: query.month,
    ...(query.employeeId ? { employeeId: query.employeeId } : {}),
    ...(query.search
      ? {
          employee: {
            OR: [
              { employeeCode: { contains: query.search, mode: "insensitive" as const } },
              { fullName: { contains: query.search, mode: "insensitive" as const } }
            ]
          }
        }
      : {})
  };
  const [total, items] = await Promise.all([
    prisma.payroll.count({ where }),
    prisma.payroll.findMany({
      where,
      include: payrollInclude,
      orderBy: {
        createdAt: "desc"
      },
      ...pagination
    })
  ]);

  return {
    items,
    meta: getPaginationMeta(query, total)
  };
}

export async function getPayroll(id: string) {
  const payroll = await prisma.payroll.findUnique({
    where: { id },
    include: payrollInclude
  });

  if (!payroll) {
    throw new AppError(404, "Payroll not found");
  }

  return payroll;
}

async function updatePayrollStatus(id: string, status: "finalized" | "published" | "locked", context: RequestContext) {
  const existing = await getPayroll(id);
  const payroll = await prisma.payroll.update({
    where: { id },
    data: {
      status,
      ...(status === "finalized" ? { finalizedById: context.actorId, finalizedAt: new Date() } : {})
    },
    include: payrollInclude
  });

  await createAuditLog({
    actorId: context.actorId,
    action: status === "finalized" ? "approve" : status,
    module: "payroll",
    targetType: "payroll",
    targetId: id,
    oldValue: existing,
    newValue: payroll,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return payroll;
}

export function approvePayroll(id: string, context: RequestContext) {
  return updatePayrollStatus(id, "finalized", context);
}

export async function publishPayroll(id: string, context: RequestContext) {
  const payroll = await updatePayrollStatus(id, "published", context);
  await enqueueEmail({
    toEmail: payroll.employee?.email,
    templateCode: "payroll_published",
    variables: {
      employeeName: payroll.employee?.fullName,
      month: payroll.month
    },
    context
  });
  return payroll;
}

export function lockPayroll(id: string, context: RequestContext) {
  return updatePayrollStatus(id, "locked", context);
}

export async function getOwnPayslip(user: Express.Request["user"], month: string) {
  if (!user?.employeeId) {
    throw new AppError(404, "Current user is not linked to an employee profile");
  }

  const payroll = await prisma.payroll.findUnique({
    where: {
      employeeId_month: {
        employeeId: user.employeeId,
        month
      }
    },
    include: payrollInclude
  });

  if (!payroll || (payroll.status !== "published" && payroll.status !== "locked")) {
    throw new AppError(404, "Payslip not found");
  }

  return payroll;
}
