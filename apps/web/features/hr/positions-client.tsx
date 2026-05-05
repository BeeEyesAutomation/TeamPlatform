"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser, hasPermission } from "../../lib/auth";
import type { Position } from "../../types/hr";
import { deletePosition, fetchPositions } from "./hr-api";
import { formatVnd } from "./format";

export function PositionsClient() {
  const [items, setItems] = useState<Position[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const user = getStoredUser();
  const canManage = hasPermission(user, "employees.manage");

  async function load() {
    try {
      const response = await fetchPositions({ search, status });
      setItems(response.data.items);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load positions");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(id: string) {
    await deletePosition(id);
    await load();
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Chuc vu</h1>
          <p className="text-sm text-muted">Quan ly chuc vu va bac luong.</p>
        </div>
        {canManage ? (
          <Link className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" href="/positions/new">
            Tao chuc vu
          </Link>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-border bg-white p-4 md:flex-row">
        <input className="h-10 rounded-md border border-border px-3 text-sm" placeholder="Tim theo ten hoac ma" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select className="h-10 rounded-md border border-border px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Tat ca trang thai</option>
          <option value="active">Dang hoat dong</option>
          <option value="inactive">Ngung hoat dong</option>
        </select>
        <button className="h-10 rounded-md border border-border px-4 text-sm font-medium" type="button" onClick={() => void load()}>
          Loc
        </button>
      </div>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="overflow-hidden rounded-md border border-border bg-white">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="p-3">Ma</th>
              <th className="p-3">Ten chuc vu</th>
              <th className="p-3">Luong co ban</th>
              <th className="p-3">Moi bac</th>
              <th className="p-3">Trang thai</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="p-3 font-medium">{item.code}</td>
                <td className="p-3">{item.name}</td>
                <td className="p-3">{formatVnd(item.baseSalary)}</td>
                <td className="p-3">{formatVnd(item.salaryStepAmount)}</td>
                <td className="p-3">{item.status}</td>
                <td className="p-3 text-right">
                  {canManage ? (
                    <div className="flex justify-end gap-2">
                      <Link className="text-primary" href={`/positions/${item.id}/edit`}>
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
