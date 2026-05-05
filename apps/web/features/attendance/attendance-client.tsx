"use client";

import { useEffect, useMemo, useState } from "react";
import { getStoredUser, hasPermission } from "../../lib/auth";
import type { AttendanceDailyItem, AttendanceMonthlyItem, AttendanceStatus } from "../../types/attendance";
import type { Department } from "../../types/hr";
import { fetchDepartments } from "../hr/hr-api";
import { fetchDailyAttendance, fetchMonthlyAttendance, lockAttendanceMonth, saveDailyAttendance, unlockAttendanceMonth } from "./attendance-api";

const today = new Date().toISOString().slice(0, 10);
const currentMonth = today.slice(0, 7);

const statusLabels: Record<AttendanceStatus, string> = {
  present: "Co mat",
  leave_paid: "Nghi co luong",
  leave_unpaid: "Nghi khong luong"
};

export function AttendanceClient() {
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(currentMonth);
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [dailyItems, setDailyItems] = useState<AttendanceDailyItem[]>([]);
  const [monthlyItems, setMonthlyItems] = useState<AttendanceMonthlyItem[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState("");
  const user = getStoredUser();
  const canManage = hasPermission(user, "attendance.manage");
  const canLock = hasPermission(user, "attendance.lock");
  const monthFromDate = useMemo(() => date.slice(0, 7), [date]);

  async function loadDepartments() {
    const response = await fetchDepartments({ pageSize: 100, status: "active" });
    setDepartments(response.data.items);
  }

  async function loadDaily() {
    try {
      const response = await fetchDailyAttendance({ date, departmentId });
      setDailyItems(response.data.employees);
      setIsLocked(response.data.isLocked);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load attendance");
    }
  }

  async function loadMonthly() {
    try {
      const response = await fetchMonthlyAttendance({ month, departmentId });
      setMonthlyItems(response.data.items);
      setIsLocked(response.data.isLocked);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load monthly summary");
    }
  }

  useEffect(() => {
    loadDepartments().catch((err) => setError(err instanceof Error ? err.message : "Cannot load departments"));
  }, []);

  useEffect(() => {
    if (canManage) {
      void loadDaily();
    }
  }, [canManage]);

  function updateRecord(employeeId: string, patch: Partial<Pick<AttendanceDailyItem, "status" | "note">>) {
    setDailyItems((items) =>
      items.map((item) => (item.employee.id === employeeId ? { ...item, ...patch } : item))
    );
  }

  async function handleSave() {
    try {
      const response = await saveDailyAttendance({
        date,
        departmentId,
        records: dailyItems.map((item) => ({
          employeeId: item.employee.id,
          status: item.status,
          note: item.note
        }))
      });
      setDailyItems(response.data.employees);
      setIsLocked(response.data.isLocked);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save attendance");
    }
  }

  async function handleLock() {
    try {
      await lockAttendanceMonth(monthFromDate);
      await loadDaily();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot lock month");
    }
  }

  async function handleUnlock() {
    try {
      await unlockAttendanceMonth(monthFromDate);
      await loadDaily();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot unlock month");
    }
  }

  if (!canManage) {
    return <div className="rounded-md border border-border bg-white p-5 text-sm text-muted">Ban khong co quyen quan ly cham cong.</div>;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cham cong thu cong</h1>
          <p className="text-sm text-muted">Chon ngay, mac dinh nhan vien co mat, chi danh dau cac truong hop nghi.</p>
        </div>
        <div className="text-sm text-muted">Trang thai thang: <span className="font-semibold text-ink">{isLocked ? "Da khoa" : "Dang mo"}</span></div>
      </div>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-3 rounded-md border border-border bg-white p-4 md:grid-cols-5">
        <label className="text-sm font-medium">
          Ngay
          <input className="mt-1 h-10 w-full rounded-md border border-border px-3" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label className="text-sm font-medium md:col-span-2">
          Phong ban
          <select className="mt-1 h-10 w-full rounded-md border border-border px-3" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
            <option value="">Tat ca phong ban</option>
            {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
          </select>
        </label>
        <button className="mt-6 h-10 rounded-md border border-border px-4 text-sm font-medium" type="button" onClick={() => void loadDaily()}>
          Tai ngay
        </button>
        <button className="mt-6 h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:bg-slate-300" type="button" disabled={isLocked} onClick={() => void handleSave()}>
          Luu cham cong
        </button>
      </div>

      {canLock ? (
        <div className="flex flex-wrap gap-2 rounded-md border border-border bg-white p-4">
          <button className="rounded-md border border-border px-4 py-2 text-sm font-medium" type="button" onClick={() => void handleLock()}>
            Khoa thang {monthFromDate}
          </button>
          <button className="rounded-md border border-border px-4 py-2 text-sm font-medium" type="button" onClick={() => void handleUnlock()}>
            Mo khoa thang {monthFromDate}
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-md border border-border bg-white">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="p-3">Ma</th>
              <th className="p-3">Nhan vien</th>
              <th className="p-3">Phong ban</th>
              <th className="p-3">Trang thai</th>
              <th className="p-3">Ghi chu</th>
            </tr>
          </thead>
          <tbody>
            {dailyItems.map((item) => (
              <tr key={item.employee.id} className="border-t border-border">
                <td className="p-3 font-medium">{item.employee.employeeCode}</td>
                <td className="p-3">{item.employee.fullName}</td>
                <td className="p-3">{item.employee.department?.name}</td>
                <td className="p-3">
                  <select className="h-10 rounded-md border border-border px-3" disabled={isLocked} value={item.status} onChange={(event) => updateRecord(item.employee.id, { status: event.target.value as AttendanceStatus })}>
                    {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </td>
                <td className="p-3">
                  <input className="h-10 w-full rounded-md border border-border px-3" disabled={isLocked} value={item.note} onChange={(event) => updateRecord(item.employee.id, { note: event.target.value })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 rounded-md border border-border bg-white p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end">
          <label className="text-sm font-medium">
            Thang tong hop
            <input className="mt-1 h-10 rounded-md border border-border px-3" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </label>
          <button className="h-10 rounded-md border border-border px-4 text-sm font-medium" type="button" onClick={() => void loadMonthly()}>
            Xem tong hop
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-surface text-left text-muted">
              <tr>
                <th className="p-3">Nhan vien</th>
                <th className="p-3">Ngay cong</th>
                <th className="p-3">Co mat</th>
                <th className="p-3">Nghi co luong</th>
                <th className="p-3">Nghi khong luong</th>
                <th className="p-3">Ty le</th>
              </tr>
            </thead>
            <tbody>
              {monthlyItems.map((item) => (
                <tr key={item.employee.id} className="border-t border-border">
                  <td className="p-3">{item.employee.fullName}</td>
                  <td className="p-3">{item.workingDays}</td>
                  <td className="p-3">{item.presentDays}</td>
                  <td className="p-3">{item.paidLeaveDays}</td>
                  <td className="p-3">{item.unpaidLeaveDays}</td>
                  <td className="p-3">{item.attendancePercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
