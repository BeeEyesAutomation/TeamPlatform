"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser, hasPermission } from "../../lib/auth";
import type { Employee } from "../../types/hr";
import { formatDate, formatVnd } from "./format";
import { fetchEmployee } from "./hr-api";

export function EmployeeDetailClient({ id }: { id: string }) {
  const [employee, setEmployee] = useState<Employee>();
  const [error, setError] = useState("");
  const user = getStoredUser();
  const canManage = hasPermission(user, "employees.manage");
  const canViewSensitive = hasPermission(user, "employees.view_sensitive") || user?.employeeId === id;

  useEffect(() => {
    fetchEmployee(id)
      .then((response) => setEmployee(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Cannot load employee"));
  }, [id]);

  if (error) {
    return <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>;
  }

  if (!employee) {
    return <div className="text-sm text-muted">Dang tai...</div>;
  }

  const positionSalary = employee.position && canViewSensitive
    ? Number(employee.position.baseSalary ?? 0) + Number(employee.position.salaryStepAmount ?? 0) * Number(employee.salaryLevel ?? 0)
    : undefined;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{employee.fullName}</h1>
          <p className="text-sm text-muted">{employee.employeeCode}</p>
        </div>
        {canManage ? (
          <Link className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" href={`/employees/${employee.id}/edit`}>
            Sua ho so
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-border bg-white p-5">
          <h2 className="text-base font-semibold">Thong tin chung</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <div><dt className="text-muted">Dien thoai</dt><dd>{employee.phone}</dd></div>
            <div><dt className="text-muted">Email</dt><dd>{employee.email}</dd></div>
            <div><dt className="text-muted">Ngay sinh</dt><dd>{formatDate(employee.dateOfBirth)}</dd></div>
            <div><dt className="text-muted">Phong ban</dt><dd>{employee.department?.name}</dd></div>
            <div><dt className="text-muted">Chuc vu</dt><dd>{employee.position?.name}</dd></div>
            <div><dt className="text-muted">Trang thai</dt><dd>{employee.status}</dd></div>
          </dl>
        </div>

        {canViewSensitive ? (
          <div className="rounded-md border border-border bg-white p-5">
            <h2 className="text-base font-semibold">Thong tin nhay cam</h2>
            <dl className="mt-3 grid gap-2 text-sm">
              <div><dt className="text-muted">So CCCD</dt><dd>{employee.citizenIdNumber}</dd></div>
              <div><dt className="text-muted">Ngan hang</dt><dd>{employee.bankName}</dd></div>
              <div><dt className="text-muted">So tai khoan</dt><dd>{employee.bankAccountNumber}</dd></div>
              <div><dt className="text-muted">Bac luong</dt><dd>{employee.salaryLevel}</dd></div>
              <div><dt className="text-muted">Luong du kien</dt><dd>{formatVnd(positionSalary)}</dd></div>
            </dl>
          </div>
        ) : null}
      </div>
    </section>
  );
}
