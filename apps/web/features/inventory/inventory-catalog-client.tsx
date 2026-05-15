"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FilterBar, ToolbarButton, fieldClassName } from "../../components/ui/controls";
import { DataTable } from "../../components/ui/data-table";
import { ErrorBanner } from "../../components/ui/feedback";
import { PageHeader } from "../../components/ui/page-header";
import { StatusBadge } from "../../components/ui/status-badge";
import type { InventoryCategory, InventorySupplier } from "../../types/inventory";
import { fetchInventoryCategories, fetchInventorySuppliers, saveInventoryCategory, saveInventorySupplier } from "./inventory-api";

type CatalogType = "categories" | "suppliers";

export function InventoryCatalogClient({ type }: { type: CatalogType }) {
  const [items, setItems] = useState<Array<InventoryCategory | InventorySupplier>>([]);
  const [form, setForm] = useState({ id: "", code: "", name: "", contactName: "", phone: "", email: "", address: "", taxCode: "", description: "", status: "active" });
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const isSupplier = type === "suppliers";

  async function load() {
    try {
      const response = isSupplier ? await fetchInventorySuppliers({ search, pageSize: 100 }) : await fetchInventoryCategories({ search, pageSize: 100 });
      setItems(response.data.items);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load catalog");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const payload = isSupplier
        ? form
        : { code: form.code, name: form.name, description: form.description, status: form.status };
      if (isSupplier) {
        await saveInventorySupplier(payload, form.id || undefined);
      } else {
        await saveInventoryCategory(payload, form.id || undefined);
      }
      setForm({ id: "", code: "", name: "", contactName: "", phone: "", email: "", address: "", taxCode: "", description: "", status: "active" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save catalog");
    }
  }

  function edit(item: InventoryCategory | InventorySupplier) {
    const supplier = item as InventorySupplier;
    setForm({
      id: item.id,
      code: item.code,
      name: item.name,
      contactName: supplier.contactName ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      address: supplier.address ?? "",
      taxCode: supplier.taxCode ?? "",
      description: item.description ?? "",
      status: item.status
    });
  }

  return (
    <section className="space-y-4">
      <PageHeader title={isSupplier ? "Nha cung cap vat tu" : "Nhom vat tu"} description={isSupplier ? "Quan ly danh sach nha cung cap cho kho." : "Quan ly nhom va phan loai vat tu."} />
      <ErrorBanner message={error} />
      <form className="grid gap-3 rounded-md border border-border bg-white p-4 md:grid-cols-2" onSubmit={(event) => void submit(event)}>
        <input className={fieldClassName()} required placeholder="Ma" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
        <input className={fieldClassName()} required placeholder="Ten" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        {isSupplier ? (
          <>
            <input className={fieldClassName()} placeholder="Nguoi lien he" value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} />
            <input className={fieldClassName()} placeholder="Dien thoai" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            <input className={fieldClassName()} placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <input className={fieldClassName()} placeholder="Ma so thue" value={form.taxCode} onChange={(event) => setForm({ ...form, taxCode: event.target.value })} />
          </>
        ) : null}
        <select className={fieldClassName()} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
          <option value="active">Dang dung</option>
          <option value="inactive">Ngung</option>
        </select>
        <textarea className="min-h-20 rounded-md border border-border p-3 text-sm md:col-span-2" placeholder="Mo ta / dia chi" value={isSupplier ? form.address || form.description : form.description} onChange={(event) => setForm(isSupplier ? { ...form, address: event.target.value } : { ...form, description: event.target.value })} />
        <ToolbarButton variant="primary" type="submit">{form.id ? "Cap nhat" : "Tao moi"}</ToolbarButton>
      </form>

      <FilterBar>
        <input className={fieldClassName("md:col-span-2")} placeholder="Tim theo ma hoac ten" value={search} onChange={(event) => setSearch(event.target.value)} />
        <ToolbarButton onClick={() => void load()}>Loc</ToolbarButton>
      </FilterBar>

      <DataTable
        items={items}
        getRowKey={(item) => item.id}
        columns={[
          { key: "code", header: "Ma", render: (item) => item.code },
          { key: "name", header: "Ten", render: (item) => item.name },
          { key: "status", header: "Trang thai", render: (item) => <StatusBadge value={item.status} /> },
          { key: "actions", header: "", className: "text-right", render: (item) => <button className="font-medium text-primary" type="button" onClick={() => edit(item)}>Sua</button> }
        ]}
      />
    </section>
  );
}
