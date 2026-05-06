"use client";

import { useEffect, useState } from "react";
import { getStoredUser, hasPermission } from "../../lib/auth";
import type { Payroll } from "../../types/payroll";
import { approvePayroll, fetchPayroll, lockPayroll, publishPayroll } from "./payroll-api";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function PayrollDetailClient({ id }: { id: string }) {
  const user = getStoredUser();
  const canManage = hasPermission(user, "payroll.manage");
  const canPublish = hasPermission(user, "payroll.publish");
  const [payroll, setPayroll] = useState<Payroll>();
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await fetchPayroll(id);
      setPayroll(response.data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load payroll");
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function mutate(action: (id: string) => Promise<{ data: Payroll }>) {
    try {
      const response = await action(id);
      setPayroll(response.data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot update payroll");
    }
  }

  if (!payroll) {
    return <div className="rounded-md border border-border bg-white p-5 text-sm text-muted">Dang tai bang luong...</div>;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{payroll.employee?.fullName ?? "Bang luong"}</h1>
          <p className="mt-2 text-sm text-muted">Thang {payroll.month} - {payroll.status}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage ? <button className="rounded-md border border-border px-4 py-2 text-sm" type="button" onClick={() => void mutate(approvePayroll)}>Duyet</button> : null}
          {canPublish ? <button className="rounded-md border border-border px-4 py-2 text-sm" type="button" onClick={() => void mutate(publishPayroll)}>Cong bo</button> : null}
          {canManage ? <button className="rounded-md border border-border px-4 py-2 text-sm" type="button" onClick={() => void mutate(lockPayroll)}>Khoa</button> : null}
        </div>
      </div>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Luong vi tri" value={payroll.positionSalary} />
        <Metric label="Phu cap" value={payroll.totalAllowances} />
        <Metric label="Thuong" value={payroll.totalBonuses} />
        <Metric label="Thuc linh" value={payroll.netSalary} strong />
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="p-3">Ma</th>
              <th className="p-3">Khoan muc</th>
              <th className="p-3">Loai</th>
              <th className="p-3">So tien</th>
              <th className="p-3">Thue</th>
              <th className="p-3">Bao hiem</th>
            </tr>
          </thead>
          <tbody>
            {(payroll.payrollItems ?? []).map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="p-3 font-medium">{item.code}</td>
                <td className="p-3">{item.name}</td>
                <td className="p-3">{item.type}</td>
                <td className="p-3">{money.format(Number(item.amount))}</td>
                <td className="p-3">{item.isTaxable ? "Co" : "Khong"}</td>
                <td className="p-3">{item.isInsuranceBased ? "Co" : "Khong"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function Metric({ label, value, strong = false }: { label: string; value: string | number; strong?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-white p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className={strong ? "mt-1 text-lg font-semibold" : "mt-1 text-base font-semibold"}>{money.format(Number(value))}</div>
    </div>
  );
}
