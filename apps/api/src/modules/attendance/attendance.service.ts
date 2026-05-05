import { prisma } from "../../prisma/client";
import { AppError } from "../../utils/app-error";
import { createAuditLog } from "../audit/audit.service";
import { findAttendanceLock, listActiveEmployees, listAttendanceRecordsForDate, listMonthlyAttendance } from "./attendance.repository";
import { getMonthFromDate, parseBusinessDate } from "./attendance.utils";
import type { AttendanceStatusInput } from "./attendance.schemas";

interface RequestContext {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface SaveAttendanceInput {
  date: string;
  departmentId?: string;
  records: Array<{
    employeeId: string;
    status: AttendanceStatusInput;
    note?: string;
  }>;
}

const summaryDefaults = () => ({
  workingDays: 0,
  presentDays: 0,
  paidLeaveDays: 0,
  unpaidLeaveDays: 0,
  attendancePercent: 0
});

export async function getAttendanceByDate(input: { date: string; departmentId?: string }) {
  const businessDate = parseBusinessDate(input.date);
  const month = getMonthFromDate(input.date);
  const [employees, lock] = await Promise.all([
    listActiveEmployees({ departmentId: input.departmentId }),
    findAttendanceLock(month)
  ]);
  const records = await listAttendanceRecordsForDate(businessDate, employees.map((employee) => employee.id));
  const recordByEmployeeId = new Map(records.map((record) => [record.employeeId, record]));

  return {
    date: input.date,
    month,
    isLocked: Boolean(lock?.isLocked),
    employees: employees.map((employee) => {
      const record = recordByEmployeeId.get(employee.id);
      return {
        employee,
        recordId: record?.id ?? null,
        status: record?.status ?? "present",
        note: record?.note ?? ""
      };
    })
  };
}

export async function saveAttendance(input: SaveAttendanceInput, context: RequestContext) {
  const businessDate = parseBusinessDate(input.date);
  const month = getMonthFromDate(input.date);
  const lock = await findAttendanceLock(month);

  if (lock?.isLocked) {
    throw new AppError(423, "Attendance month is locked");
  }

  const activeEmployees = await listActiveEmployees({ departmentId: input.departmentId });
  const activeEmployeeIds = new Set(activeEmployees.map((employee) => employee.id));
  const submittedByEmployeeId = new Map(input.records.map((record) => [record.employeeId, record]));
  const recordsToSave = activeEmployees.map((employee) => {
    const submitted = submittedByEmployeeId.get(employee.id);
    return {
      employeeId: employee.id,
      status: submitted?.status ?? "present",
      note: submitted?.note
    };
  });

  for (const record of input.records) {
    if (!activeEmployeeIds.has(record.employeeId)) {
      throw new AppError(400, "Attendance contains an inactive or out-of-filter employee");
    }
  }

  const saved = await prisma.$transaction(
    recordsToSave.map((record) =>
      prisma.attendanceRecord.upsert({
        where: {
          employeeId_date: {
            employeeId: record.employeeId,
            date: businessDate
          }
        },
        update: {
          status: record.status,
          note: record.note,
          updatedById: context.actorId
        },
        create: {
          employeeId: record.employeeId,
          date: businessDate,
          status: record.status,
          note: record.note,
          createdById: context.actorId,
          updatedById: context.actorId
        }
      })
    )
  );

  await createAuditLog({
    actorId: context.actorId,
    action: "save",
    module: "attendance",
    targetType: "attendance_date",
    targetId: input.date,
    newValue: {
      date: input.date,
      departmentId: input.departmentId,
      totalRecords: saved.length
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return getAttendanceByDate(input);
}

export async function getMonthlyAttendanceSummary(input: { month: string; employeeId?: string; departmentId?: string }) {
  const records = await listMonthlyAttendance(input.month, {
    employeeId: input.employeeId,
    departmentId: input.departmentId
  });
  const lock = await findAttendanceLock(input.month);
  const summaryByEmployeeId = new Map<string, ReturnType<typeof summaryDefaults> & { employee: typeof records[number]["employee"] }>();

  for (const record of records) {
    const current = summaryByEmployeeId.get(record.employeeId) ?? {
      employee: record.employee,
      ...summaryDefaults()
    };
    current.workingDays += 1;
    if (record.status === "present") {
      current.presentDays += 1;
    }
    if (record.status === "leave_paid") {
      current.paidLeaveDays += 1;
    }
    if (record.status === "leave_unpaid") {
      current.unpaidLeaveDays += 1;
    }
    current.attendancePercent = current.workingDays === 0 ? 0 : Math.round((current.presentDays / current.workingDays) * 10000) / 100;
    summaryByEmployeeId.set(record.employeeId, current);
  }

  return {
    month: input.month,
    isLocked: Boolean(lock?.isLocked),
    items: Array.from(summaryByEmployeeId.values())
  };
}

export async function lockAttendanceMonth(input: { month: string; note?: string }, context: RequestContext) {
  const lock = await prisma.attendanceLock.upsert({
    where: { month: input.month },
    update: {
      isLocked: true,
      lockedById: context.actorId,
      lockedAt: new Date(),
      note: input.note
    },
    create: {
      month: input.month,
      isLocked: true,
      lockedById: context.actorId,
      lockedAt: new Date(),
      note: input.note
    }
  });

  await createAuditLog({
    actorId: context.actorId,
    action: "lock",
    module: "attendance",
    targetType: "attendance_month",
    targetId: input.month,
    newValue: lock,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return lock;
}

export async function unlockAttendanceMonth(input: { month: string; note?: string }, context: RequestContext) {
  const existing = await findAttendanceLock(input.month);

  if (!existing) {
    throw new AppError(404, "Attendance lock not found");
  }

  const lock = await prisma.attendanceLock.update({
    where: { month: input.month },
    data: {
      isLocked: false,
      note: input.note
    }
  });

  await createAuditLog({
    actorId: context.actorId,
    action: "unlock",
    module: "attendance",
    targetType: "attendance_month",
    targetId: input.month,
    oldValue: existing,
    newValue: lock,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return lock;
}
