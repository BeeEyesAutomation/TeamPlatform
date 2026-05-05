import { apiGet, apiJson } from "../../lib/api-client";
import type { AttendanceDailyResponse, AttendanceMonthlyResponse, AttendanceStatus } from "../../types/attendance";

const buildQuery = (params: Record<string, string | undefined>) => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export async function fetchDailyAttendance(params: { date: string; departmentId?: string }) {
  return apiGet<AttendanceDailyResponse>(`/api/attendance${buildQuery(params)}`);
}

export async function saveDailyAttendance(body: {
  date: string;
  departmentId?: string;
  records: Array<{ employeeId: string; status: AttendanceStatus; note?: string }>;
}) {
  return apiJson<AttendanceDailyResponse>("/api/attendance/save", "POST", body);
}

export async function fetchMonthlyAttendance(params: { month: string; departmentId?: string; employeeId?: string }) {
  return apiGet<AttendanceMonthlyResponse>(`/api/attendance/monthly${buildQuery(params)}`);
}

export async function lockAttendanceMonth(month: string, note?: string) {
  return apiJson("/api/attendance/lock", "POST", { month, note });
}

export async function unlockAttendanceMonth(month: string, note?: string) {
  return apiJson("/api/attendance/unlock", "POST", { month, note });
}
