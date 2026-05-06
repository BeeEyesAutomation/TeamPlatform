import { prisma } from "../../prisma/client";
import { AppError } from "../../utils/app-error";
import { createAuditLog } from "../audit/audit.service";
import {
  findAttendanceLock,
  listActiveEmployees,
  listAttendanceDatesForMonth,
  listAttendanceRecordsForDate,
  listMonthlyAttendance
} from "./attendance.repository";
import { getMonthFromDate, parseBusinessDate } from "./attendance.utils";
import type { AttendanceStatusInput } from "./attendance.schemas";

type StoredAttendanceStatus = "present" | "leave_paid" | "leave_unpaid";

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

function toStoredStatus(status: AttendanceStatusInput): StoredAttendanceStatus {
  if (status === "paid_leave") {
    return "leave_paid";
  }
  if (status === "unpaid_leave") {
    return "leave_unpaid";
  }
  return "present";
}

function toApiStatus(status: StoredAttendanceStatus): AttendanceStatusInput {
  if (status === "leave_paid") {
    return "paid_leave";
  }
  if (status === "leave_unpaid") {
    return "unpaid_leave";
  }
  return "present";
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

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
        status: record ? toApiStatus(record.status) : "present",
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
      status: toStoredStatus(submitted?.status ?? "present"),
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
  const [employees, records, attendanceDates, lock] = await Promise.all([
    listActiveEmployees({ departmentId: input.departmentId }).then((items) =>
      input.employeeId ? items.filter((employee) => employee.id === input.employeeId) : items
    ),
    listMonthlyAttendance(input.month, {
      employeeId: input.employeeId,
      departmentId: input.departmentId
    }),
    listAttendanceDatesForMonth(input.month, {
      departmentId: input.departmentId
    }),
    findAttendanceLock(input.month)
  ]);
  const summaryByEmployeeId = new Map<string, ReturnType<typeof summaryDefaults> & { employee: typeof records[number]["employee"] }>();
  const workingDateKeys = attendanceDates.map((item) => dateKey(item.date));
  const recordByEmployeeAndDate = new Map(records.map((record) => [`${record.employeeId}:${dateKey(record.date)}`, record]));

  for (const employee of employees) {
    const current = {
      employee,
      ...summaryDefaults()
    };

    for (const workingDate of workingDateKeys) {
      const record = recordByEmployeeAndDate.get(`${employee.id}:${workingDate}`);
      const status = record?.status ?? "present";

      current.workingDays += 1;
      if (status === "present") {
        current.presentDays += 1;
      }
      if (status === "leave_paid") {
        current.paidLeaveDays += 1;
      }
      if (status === "leave_unpaid") {
        current.unpaidLeaveDays += 1;
      }
    }

    current.attendancePercent = current.workingDays === 0 ? 0 : Math.round((current.presentDays / current.workingDays) * 10000) / 100;
    summaryByEmployeeId.set(employee.id, current);
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
