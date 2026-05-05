"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { fetchDepartment, saveDepartment } from "./hr-api";

export function DepartmentForm({ id }: { id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ code: "", name: "", description: "", status: "active" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    fetchDepartment(id)
      .then((response) => setForm({
        code: response.data.code,
        name: response.data.name,
        description: response.data.description ?? "",
        status: response.data.status
      }))
      .catch((err) => setError(err instanceof Error ? err.message : "Cannot load department"));
  }, [id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await saveDepartment(form, id);
      router.push("/departments");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save department");
    }
  }

  return (
    <form className="max-w-2xl space-y-4 rounded-md border border-border bg-white p-5" onSubmit={(event) => void submit(event)}>
      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      <label className="block text-sm font-medium">
        Ma phong ban
        <input className="mt-1 h-10 w-full rounded-md border border-border px-3" required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
      </label>
      <label className="block text-sm font-medium">
        Ten phong ban
        <input className="mt-1 h-10 w-full rounded-md border border-border px-3" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
      </label>
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
