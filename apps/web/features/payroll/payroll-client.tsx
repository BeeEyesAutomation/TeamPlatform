"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser, hasPermission } from "../../lib/auth";
import type { Payroll } from "../../types/payroll";
import { calculatePayroll, fetchPayrolls } from "./payroll-api";

const currentMonth = new Date().toISOString().slice(0, 7);
const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function PayrollClient() {
  const user = getStoredUser();
  const canView = hasPermission(user, "payroll.view");
  const canManage = hasPermission(user, "payroll.manage");
  const [month, setMonth] = useState(currentMonth);
  const [items, setItems] = useState<Payroll[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await fetchPayrolls({ month, pageSize: 100 });
      setItems(response.data.items);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load payroll");
    }
  }

  async function runCalculation() {
    try {
      const response = await calculatePayroll(month);
      setItems(response.data.items);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot calculate payroll");
    }
  }

  useEffect(() => {
    if (canView) {
      void load();
    }
  }, [canView]);

  if (!canView) {
    return <div className="rounded-md border border-border bg-white p-5 text-sm text-muted">Ban khong co quyen xem bang luong.</div>;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tinh bang luong</h1>
          <p className="mt-2 text-sm text-muted">Tinh luong nhap, phu cap, thue, bao hiem va phieu luong theo thang.</p>
        </div>
        <Link className="rounded-md border border-border px-4 py-2 text-sm font-medium" href="/payroll/payslip">Phieu luong cua toi</Link>
      </div>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="flex flex-col gap-3 rounded-md border border-border bg-white p-4 md:flex-row md:items-end">
        <label className="text-sm font-medium">
          Thang
          <input className="mt-1 h-10 rounded-md border border-border px-3" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </label>
        <button className="h-10 rounded-md border border-border px-4 text-sm font-medium" type="button" onClick={() => void load()}>
          Tai danh sach
        </button>
        {canManage ? (
          <button className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white" type="button" onClick={() => void runCalculation()}>
            Tinh bang luong
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-white">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="p-3">Nhan vien</th>
              <th className="p-3">Thang</th>
              <th className="p-3">Luong vi tri</th>
              <th className="p-3">Phu cap</th>
              <th className="p-3">Thuong</th>
              <th className="p-3">Khau tru</th>
              <th className="p-3">Thue</th>
              <th className="p-3">Thuc linh</th>
              <th className="p-3">Trang thai</th>
              <th className="p-3">Chi tiet</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="p-3">{item.employee?.fullName ?? item.employeeId}</td>
                <td className="p-3">{item.month}</td>
                <td className="p-3">{money.format(Number(item.positionSalary))}</td>
                <td className="p-3">{money.format(Number(item.totalAllowances))}</td>
                <td className="p-3">{money.format(Number(item.totalBonuses))}</td>
                <td className="p-3">{money.format(Number(item.totalDeductions))}</td>
                <td className="p-3">{money.format(Number(item.personalIncomeTax))}</td>
                <td className="p-3 font-semibold">{money.format(Number(item.netSalary))}</td>
                <td className="p-3">{item.status}</td>
                <td className="p-3"><Link className="text-primary" href={`/payroll/${item.id}`}>Mo</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
