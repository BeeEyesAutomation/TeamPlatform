"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { getStoredUser, hasPermission } from "../../lib/auth";
import type { Project } from "../../types/projects";
import { fetchProjects, saveProject } from "./projects-api";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function ProjectsClient() {
  const user = getStoredUser();
  const canView = hasPermission(user, "projects.view");
  const canManage = hasPermission(user, "projects.manage");
  const [items, setItems] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await fetchProjects({ search, pageSize: 100 });
      setItems(response.data.items);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load projects");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await saveProject({
        projectCode: form.get("projectCode"),
        name: form.get("name"),
        customerName: form.get("customerName"),
        budgetEstimated: form.get("budgetEstimated") || undefined
      });
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save project");
    }
  }

  useEffect(() => {
    if (canView) void load();
  }, [canView]);

  if (!canView) {
    return <div className="rounded-md border border-border bg-white p-5 text-sm text-muted">Ban khong co quyen xem du an.</div>;
  }

  return (
    <section className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-semibold">Du an</h1>
        <p className="mt-2 text-sm text-muted">Quan ly ho so, tien do, thanh vien, chi phi va vat tu du an.</p>
      </div>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="flex flex-col gap-3 rounded-md border border-border bg-white p-4 md:flex-row md:items-end">
        <label className="text-sm font-medium">
          Tim kiem
          <input className="mt-1 h-10 rounded-md border border-border px-3" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <button className="h-10 rounded-md border border-border px-4 text-sm font-medium" type="button" onClick={() => void load()}>
          Tai danh sach
        </button>
      </div>

      {canManage ? (
        <form className="grid gap-3 rounded-md border border-border bg-white p-4 md:grid-cols-4" onSubmit={(event) => void submit(event)}>
          <input className="h-10 rounded-md border border-border px-3 text-sm" name="projectCode" placeholder="Ma du an" required />
          <input className="h-10 rounded-md border border-border px-3 text-sm" name="name" placeholder="Ten du an" required />
          <input className="h-10 rounded-md border border-border px-3 text-sm" name="customerName" placeholder="Khach hang" />
          <div className="flex gap-2">
            <input className="h-10 min-w-0 flex-1 rounded-md border border-border px-3 text-sm" name="budgetEstimated" placeholder="Ngan sach" type="number" min="0" />
            <button className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white" type="submit">Tao</button>
          </div>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-md border border-border bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="p-3">Ma</th>
              <th className="p-3">Du an</th>
              <th className="p-3">Khach hang</th>
              <th className="p-3">Tien do</th>
              <th className="p-3">Ngan sach</th>
              <th className="p-3">Trang thai</th>
              <th className="p-3">Chi tiet</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="p-3 font-medium">{item.projectCode}</td>
                <td className="p-3">{item.name}</td>
                <td className="p-3">{item.customerName ?? "-"}</td>
                <td className="p-3">{Number(item.progressPercent)}%</td>
                <td className="p-3">{item.budgetEstimated ? money.format(Number(item.budgetEstimated)) : "-"}</td>
                <td className="p-3">{item.status}</td>
                <td className="p-3"><Link className="text-primary" href={`/projects/${item.id}`}>Mo</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
