"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { fetchPosition, savePosition } from "./hr-api";

export function PositionForm({ id }: { id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    baseSalary: "0",
    salaryStepAmount: "0",
    status: "active"
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    fetchPosition(id)
      .then((response) => setForm({
        code: response.data.code,
        name: response.data.name,
        description: response.data.description ?? "",
        baseSalary: String(response.data.baseSalary ?? 0),
        salaryStepAmount: String(response.data.salaryStepAmount ?? 0),
        status: response.data.status
      }))
      .catch((err) => setError(err instanceof Error ? err.message : "Cannot load position"));
  }, [id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await savePosition({
        ...form,
        baseSalary: Number(form.baseSalary),
        salaryStepAmount: Number(form.salaryStepAmount)
      }, id);
      router.push("/positions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save position");
    }
  }

  return (
    <form className="max-w-2xl space-y-4 rounded-md border border-border bg-white p-5" onSubmit={(event) => void submit(event)}>
      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      <label className="block text-sm font-medium">
        Ma chuc vu
        <input className="mt-1 h-10 w-full rounded-md border border-border px-3" required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
      </label>
      <label className="block text-sm font-medium">
        Ten chuc vu
        <input className="mt-1 h-10 w-full rounded-md border border-border px-3" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium">
          Luong co ban
          <input className="mt-1 h-10 w-full rounded-md border border-border px-3" min="0" required type="number" value={form.baseSalary} onChange={(event) => setForm({ ...form, baseSalary: event.target.value })} />
        </label>
        <label className="block text-sm font-medium">
          So tien moi bac
          <input className="mt-1 h-10 w-full rounded-md border border-border px-3" min="0" required type="number" value={form.salaryStepAmount} onChange={(event) => setForm({ ...form, salaryStepAmount: event.target.value })} />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Mo ta
        <textarea className="mt-1 min-h-24 w-full rounded-md border border-border px-3 py-2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
      </label>
      <label className="block text-sm font-medium">
        Trang thai
        <select className="mt-1 h-10 w-full rounded-md border border-border px-3" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
          <option value="active">Dang hoat dong</option>
          <option value="inactive">Ngung hoat dong</option>
        </select>
      </label>
      <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" type="submit">
        Luu
      </button>
    </form>
  );
}
