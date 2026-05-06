"use client";

import { useState, type FormEvent } from "react";
import type { Payroll } from "../../types/payroll";
import { fetchMyPayslip } from "./payroll-api";

const currentMonth = new Date().toISOString().slice(0, 7);
const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function PayslipClient() {
  const [month, setMonth] = useState(currentMonth);
  const [payroll, setPayroll] = useState<Payroll>();
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const response = await fetchMyPayslip(month);
      setPayroll(response.data);
      setError("");
    } catch (err) {
      setPayroll(undefined);
      setError(err instanceof Error ? err.message : "Cannot load payslip");
    }
  }

  return (
    <section className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-semibold">Phieu luong cua toi</h1>
        <p className="mt-2 text-sm text-muted">Chi hien thi phieu luong da cong bo.</p>
      </div>

      <form className="flex flex-col gap-3 rounded-md border border-border bg-white p-4 md:flex-row md:items-end" onSubmit={(event) => void submit(event)}>
        <label className="text-sm font-medium">
          Thang
          <input className="mt-1 h-10 rounded-md border border-border px-3" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </label>
        <button className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white" type="submit">Xem phieu luong</button>
      </form>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      {payroll ? (
        <div className="space-y-4 rounded-md border border-border bg-white p-5">
          <div>
            <div className="text-sm text-muted">{payroll.employee?.employeeCode}</div>
            <div className="text-xl font-semibold">{payroll.employee?.fullName}</div>
            <div className="text-sm text-muted">Thang {payroll.month}</div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div><div className="text-sm text-muted">Tong thu nhap</div><div className="font-semibold">{money.format(Number(payroll.positionSalary) + Number(payroll.totalAllowances) + Number(payroll.totalBonuses))}</div></div>
            <div><div className="text-sm text-muted">Thue va bao hiem</div><div className="font-semibold">{money.format(Number(payroll.personalIncomeTax) + Number(payroll.socialInsurance) + Number(payroll.healthInsurance) + Number(payroll.unemploymentInsurance))}</div></div>
            <div><div className="text-sm text-muted">Thuc linh</div><div className="font-semibold">{money.format(Number(payroll.netSalary))}</div></div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
