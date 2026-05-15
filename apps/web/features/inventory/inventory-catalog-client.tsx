"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FilterBar, ToolbarButton, fieldClassName } from "../../components/ui/controls";
import { DataTable } from "../../components/ui/data-table";
import { ErrorBanner } from "../../components/ui/feedback";
import { PageHeader } from "../../components/ui/page-header";
import { StatusBadge } from "../../components/ui/status-badge";
import { getStoredUser, hasPermission } from "../../lib/auth";
import type { InventoryCategory, InventorySupplier } from "../../types/inventory";
import { deleteInventoryCategory, deleteInventorySupplier, fetchInventoryCategories, fetchInventorySuppliers, saveInventoryCategory, saveInventorySupplier } from "./inventory-api";

type CatalogType = "categories" | "suppliers";

export function InventoryCatalogClient({ type }: { type: CatalogType }) {
  const [items, setItems] = useState<Array<InventoryCategory | InventorySupplier>>([]);
  const [form, setForm] = useState({ id: "", code: "", name: "", department: "", contactName: "", phone: "", email: "", address: "", taxCode: "", description: "", status: "active" });
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const isSupplier = type === "suppliers";
  const user = getStoredUser();
  const canManage = hasPermission(user, isSupplier ? "inventory.suppliers.manage" : "inventory.categories.manage");
  const emptyForm = { id: "", code: "", name: "", department: "", contactName: "", phone: "", email: "", address: "", taxCode: "", description: "", status: "active" };

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
        : { code: form.code, name: form.name, department: form.department, description: form.description, status: form.status };
      if (isSupplier) {
        await saveInventorySupplier(payload, form.id || undefined);
      } else {
        await saveInventoryCategory(payload, form.id || undefined);
      }
      setForm(emptyForm);
      setMessage("Da luu du lieu.");
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
      department: (item as InventoryCategory).department ?? "",
      contactName: supplier.contactName ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      address: supplier.address ?? "",
      taxCode: supplier.taxCode ?? "",
      description: item.description ?? "",
      status: item.status
    });
  }

  async function handleDelete(id: string) {
    if (!window.confirm(isSupplier ? "Ngung nha cung cap nay?" : "Ngung nhom vat tu nay?")) return;
    try {
      if (isSupplier) {
        await deleteInventorySupplier(id);
      } else {
        await deleteInventoryCategory(id);
      }
      setMessage("Da ngung hoat dong.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot delete catalog");
    }
  }

  return (
    <section className="space-y-4">
      <PageHeader title={isSupplier ? "Nha cung cap vat tu" : "Nhom vat tu"} description={isSupplier ? "Quan ly danh sach nha cung cap cho kho." : "Quan ly nhom va phan loai vat tu."} />
      <ErrorBanner message={error} />
      {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div> : null}
      {canManage ? <form className="grid gap-3 rounded-md border border-border bg-white p-4 md:grid-cols-2" onSubmit={(event) => void submit(event)}>
        <input className={fieldClassName()} required placeholder="Ma" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
        <input className={fieldClassName()} required placeholder="Ten" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        {isSupplier ? (
          <>
            <input className={fieldClassName()} placeholder="Nguoi lien he" value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} />
            <input className={fieldClassName()} placeholder="Dien thoai" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            <input className={fieldClassName()} placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <input className={fieldClassName()} placeholder="Ma so thue" value={form.taxCode} onChange={(event) => setForm({ ...form, taxCode: event.target.value })} />
          </>
        ) : (
          <input className={fieldClassName()} placeholder="Bo phan" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
        )}
        <select className={fieldClassName()} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
          <option value="active">Dang dung</option>
          <option value="inactive">Ngung</option>
        </select>
        <textarea className="min-h-20 rounded-md border border-border p-3 text-sm md:col-span-2" placeholder={isSupplier ? "Dia chi" : "Mo ta"} value={isSupplier ? form.address : form.description} onChange={(event) => setForm(isSupplier ? { ...form, address: event.target.value } : { ...form, description: event.target.value })} />
        {isSupplier ? <textarea className="min-h-20 rounded-md border border-border p-3 text-sm md:col-span-2" placeholder="Ghi chu" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /> : null}
        <ToolbarButton variant="primary" type="submit">{form.id ? "Cap nhat" : "Tao moi"}</ToolbarButton>
        {form.id ? <ToolbarButton onClick={() => setForm(emptyForm)}>Huy</ToolbarButton> : null}
      </form> : null}

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
          ...(isSupplier ? [
            { key: "phone", header: "Dien thoai", render: (item: InventoryCategory | InventorySupplier) => (item as InventorySupplier).phone ?? "-" },
            { key: "email", header: "Email", render: (item: InventoryCategory | InventorySupplier) => (item as InventorySupplier).email ?? "-" }
          ] : [
            { key: "department", header: "Bo phan", render: (item: InventoryCategory | InventorySupplier) => (item as InventoryCategory).department ?? "-" }
          ]),
          { key: "status", header: "Trang thai", render: (item) => <StatusBadge value={item.status} /> },
          {
            key: "actions",
            header: "",
            className: "text-right",
            render: (item) => canManage ? (
              <div className="flex justify-end gap-3">
                <button className="font-medium text-primary" type="button" onClick={() => edit(item)}>Sua</button>
                <button className="font-medium text-red-700" type="button" onClick={() => void handleDelete(item.id)}>Ngung</button>
              </div>
            ) : null
          }
        ]}
      />
    </section>
  );
}
