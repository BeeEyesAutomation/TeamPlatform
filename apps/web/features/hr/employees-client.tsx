"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser, hasPermission } from "../../lib/auth";
import type { Department, Employee, Position } from "../../types/hr";
import { deleteEmployee, fetchDepartments, fetchEmployees, fetchPositions } from "./hr-api";

export function EmployeesClient() {
  const [items, setItems] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [filters, setFilters] = useState({ search: "", departmentId: "", positionId: "", status: "" });
  const [error, setError] = useState("");
  const user = getStoredUser();
  const canManage = hasPermission(user, "employees.manage");
  const canViewSensitive = hasPermission(user, "employees.view_sensitive");

  async function load() {
    try {
      const [employeeResponse, departmentResponse, positionResponse] = await Promise.all([
        fetchEmployees(filters),
        fetchDepartments({ pageSize: 100 }),
        fetchPositions({ pageSize: 100 })
      ]);
      setItems(employeeResponse.data.items);
      setDepartments(departmentResponse.data.items);
      setPositions(positionResponse.data.items);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load employees");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(id: string) {
    await deleteEmployee(id);
    await load();
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Nhan su</h1>
          <p className="text-sm text-muted">Quan ly ho so nhan vien va thong tin lien quan.</p>
        </div>
        {canManage ? (
          <Link className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" href="/employees/new">
            Tao nhan vien
          </Link>
        ) : null}
      </div>

      <div className="grid gap-2 rounded-md border border-border bg-white p-4 md:grid-cols-5">
        <input className="h-10 rounded-md border border-border px-3 text-sm" placeholder="Ten, ma, dien thoai" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        <select className="h-10 rounded-md border border-border px-3 text-sm" value={filters.departmentId} onChange={(event) => setFilters({ ...filters, departmentId: event.target.value })}>
          <option value="">Tat ca phong ban</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>{department.name}</option>
          ))}
        </select>
        <select className="h-10 rounded-md border border-border px-3 text-sm" value={filters.positionId} onChange={(event) => setFilters({ ...filters, positionId: event.target.value })}>
          <option value="">Tat ca chuc vu</option>
          {positions.map((position) => (
            <option key={position.id} value={position.id}>{position.name}</option>
          ))}
        </select>
        <select className="h-10 rounded-md border border-border px-3 text-sm" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="">Tat ca trang thai</option>
          <option value="probation">Thu viec</option>
          <option value="active">Dang lam</option>
          <option value="temporarily_inactive">Tam nghi</option>
          <option value="resigned">Da nghi</option>
        </select>
        <button className="h-10 rounded-md border border-border px-4 text-sm font-medium" type="button" onClick={() => void load()}>
          Loc
        </button>
      </div>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="overflow-x-auto rounded-md border border-border bg-white">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="p-3">Ma</th>
              <th className="p-3">Ho ten</th>
              <th className="p-3">Dien thoai</th>
              <th className="p-3">Phong ban</th>
              <th className="p-3">Chuc vu</th>
              {canViewSensitive ? <th className="p-3">Bac luong</th> : null}
              <th className="p-3">Trang thai</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="p-3 font-medium">{item.employeeCode}</td>
                <td className="p-3">
                  <Link className="text-primary" href={`/employees/${item.id}`}>{item.fullName}</Link>
                </td>
                <td className="p-3">{item.phone}</td>
                <td className="p-3">{item.department?.name}</td>
                <td className="p-3">{item.position?.name}</td>
                {canViewSensitive ? <td className="p-3">{item.salaryLevel ?? ""}</td> : null}
                <td className="p-3">{item.status}</td>
                <td className="p-3 text-right">
                  {canManage ? (
                    <div className="flex justify-end gap-2">
                      <Link className="text-primary" href={`/employees/${item.id}/edit`}>
                        Sua
                      </Link>
                      <button className="text-red-700" type="button" onClick={() => void handleDelete(item.id)}>
                        Ngung
                      </button>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
