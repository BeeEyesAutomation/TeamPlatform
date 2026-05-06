import type { Department } from "./hr";

export type AttendanceStatus = "present" | "paid_leave" | "unpaid_leave";

export interface AttendanceEmployee {
  id: string;
  employeeCode: string;
  fullName: string;
  departmentId?: string | null;
  department?: Pick<Department, "id" | "code" | "name"> | null;
}

export interface AttendanceDailyItem {
  employee: AttendanceEmployee;
  recordId: string | null;
  status: AttendanceStatus;
  note: string;
}

export interface AttendanceDailyResponse {
  date: string;
  month: string;
  isLocked: boolean;
  employees: AttendanceDailyItem[];
}

export interface AttendanceMonthlyItem {
  employee: AttendanceEmployee;
  workingDays: number;
  presentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  attendancePercent: number;
}

export interface AttendanceMonthlyResponse {
  month: string;
  isLocked: boolean;
  items: AttendanceMonthlyItem[];
}
