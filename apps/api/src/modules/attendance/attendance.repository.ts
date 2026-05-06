import { prisma } from "../../prisma/client";
import { getMonthRange } from "./attendance.utils";

export interface ActiveEmployeeFilters {
  departmentId?: string;
}

export function listActiveEmployees(filters: ActiveEmployeeFilters) {
  return prisma.employee.findMany({
    where: {
      deletedAt: null,
      status: "active",
      ...(filters.departmentId ? { departmentId: filters.departmentId } : {})
    },
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    },
    orderBy: [{ department: { name: "asc" } }, { fullName: "asc" }]
  });
}

export function listAttendanceRecordsForDate(date: Date, employeeIds: string[]) {
  return prisma.attendanceRecord.findMany({
    where: {
      date,
      employeeId: {
        in: employeeIds
      }
    }
  });
}

export function findAttendanceLock(month: string) {
  return prisma.attendanceLock.findUnique({
    where: { month }
  });
}

export function listMonthlyAttendance(month: string, filters: { employeeId?: string; departmentId?: string }) {
  const range = getMonthRange(month);

  return prisma.attendanceRecord.findMany({
    where: {
      date: {
        gte: range.start,
        lt: range.end
      },
      ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
      employee: {
        deletedAt: null,
        ...(filters.departmentId ? { departmentId: filters.departmentId } : {})
      }
    },
    include: {
      employee: {
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
          department: {
            select: {
              id: true,
              code: true,
              name: true
            }
          }
        }
      }
    },
    orderBy: [{ employee: { fullName: "asc" } }, { date: "asc" }]
  });
}

export function listAttendanceDatesForMonth(month: string, filters: { departmentId?: string }) {
  const range = getMonthRange(month);

  return prisma.attendanceRecord.findMany({
    where: {
      date: {
        gte: range.start,
        lt: range.end
      },
      employee: {
        deletedAt: null,
        ...(filters.departmentId ? { departmentId: filters.departmentId } : {})
      }
    },
    select: {
      date: true
    },
    distinct: ["date"],
    orderBy: {
      date: "asc"
    }
  });
}
