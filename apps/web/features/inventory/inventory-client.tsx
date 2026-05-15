"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { FilterBar, ToolbarButton, fieldClassName } from "../../components/ui/controls";
import { DataTable } from "../../components/ui/data-table";
import { ErrorBanner } from "../../components/ui/feedback";
import { PageHeader } from "../../components/ui/page-header";
import { StatusBadge } from "../../components/ui/status-badge";
import { getStoredUser, hasPermission } from "../../lib/auth";
import type { InventoryCategory, InventoryItem, InventorySummary, InventorySupplier } from "../../types/inventory";
import { bulkDeactivateInventoryItems, deleteInventoryItem, fetchInventoryCategories, fetchInventoryItems, fetchInventorySummary, fetchInventorySuppliers, saveInventoryItem } from "./inventory-api";
import { formatNumber, formatVnd } from "./inventory-format";

const emptyForm = {
  id: "",
  materialCode: "",
  materialName: "",
  categoryId: "",
  supplierId: "",
  purchasePrice: "0",
  sellingPrice: "0",
  markupPercentage: "0",
  stockQuantity: "0",
  minimumStockQuantity: "0",
  unit: "",
  status: "active",
  description: ""
};

export function InventoryClient() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([]);
  const [summary, setSummary] = useState<InventorySummary>();
  const [filters, setFilters] = useState({ search: "", categoryId: "", supplierId: "", status: "", stockStatus: "" });
  const [form, setForm] = useState(emptyForm);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const user = getStoredUser();
  const canManage = hasPermission(user, "inventory.manage");
  const canViewCost = hasPermission(user, "inventory.view_cost");
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  async function load() {
    setLoading(true);
    try {
      const [itemsResponse, categoriesResponse, suppliersResponse, summaryResponse] = await Promise.all([
        fetchInventoryItems(filters),
        fetchInventoryCategories({ pageSize: 100 }),
        fetchInventorySuppliers({ pageSize: 100 }),
        fetchInventorySummary()
      ]);
      setItems(itemsResponse.data.items);
      setCategories(categoriesResponse.data.items);
      setSuppliers(suppliersResponse.data.items);
      setSummary(summaryResponse.data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load inventory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function edit(item: InventoryItem) {
    setForm({
      id: item.id,
      materialCode: item.materialCode,
      materialName: item.materialName,
      categoryId: item.categoryId ?? "",
      supplierId: item.supplierId ?? "",
      purchasePrice: String(item.purchasePrice ?? 0),
      sellingPrice: String(item.sellingPrice ?? 0),
      markupPercentage: String(item.markupPercentage ?? 0),
      stockQuantity: String(item.stockQuantity ?? 0),
      minimumStockQuantity: String(item.minimumStockQuantity ?? 0),
      unit: item.unit,
      status: item.status,
      description: item.description ?? ""
    });
    setMessage("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await saveInventoryItem({
        ...form,
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
        markupPercentage: Number(form.markupPercentage),
        stockQuantity: Number(form.stockQuantity),
        minimumStockQuantity: Number(form.minimumStockQuantity),
        categoryId: form.categoryId,
        supplierId: form.supplierId
      }, form.id || undefined);
      setForm(emptyForm);
      setMessage("Da luu vat tu.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save material");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Ngung hoat dong vat tu nay?")) return;
    await deleteInventoryItem(id);
    setMessage("Da ngung hoat dong vat tu.");
    await load();
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Ngung hoat dong ${selectedIds.length} vat tu da chon?`)) return;
    const response = await bulkDeactivateInventoryItems(selectedIds);
    setSelectedIds([]);
    setMessage(`Da xu ly ${response.data.results.length} vat tu.`);
    await load();
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]);
  }

  function toggleAll() {
    setSelectedIds((current) => current.length === items.length ? [] : items.map((item) => item.id));
  }

  return (
    <section className="space-y-4">
      <PageHeader title="Kho vat tu" description="Quan ly danh sach vat tu, nhom vat tu, nha cung cap, gia va ton kho." />

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryTile label="Vat tu" value={summary?.totalItems ?? 0} />
        <SummaryTile label="Sap het" value={summary?.lowStockItems ?? 0} />
        <SummaryTile label="Nhom vat tu" value={summary?.activeCategories ?? 0} />
        <SummaryTile label="Gia tri ton" value={canViewCost ? formatVnd(summary?.stockValue ?? 0) : "***"} />
      </div>

      {canManage ? (
        <form className="grid gap-3 rounded-md border border-border bg-white p-4 lg:grid-cols-6" onSubmit={(event) => void submit(event)}>
          <input className={fieldClassName()} required placeholder="Ma vat tu" value={form.materialCode} onChange={(event) => setForm({ ...form, materialCode: event.target.value })} />
          <input className={fieldClassName()} required placeholder="Ten vat tu" value={form.materialName} onChange={(event) => setForm({ ...form, materialName: event.target.value })} />
          <select className={fieldClassName()} required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
            <option value="">Nhom vat tu</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.code} - {category.name}</option>)}
          </select>
          <select className={fieldClassName()} required value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })}>
            <option value="">Nha cung cap</option>
            {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
          </select>
          <input className={fieldClassName()} min="0" step="1" required type="number" placeholder="Gia mua" value={form.purchasePrice} onChange={(event) => setForm({ ...form, purchasePrice: event.target.value })} />
          <input className={fieldClassName()} min="0" step="1" required type="number" placeholder="Gia ban" value={form.sellingPrice} onChange={(event) => setForm({ ...form, sellingPrice: event.target.value })} />
          <input className={fieldClassName()} min="0" step="0.01" required type="number" placeholder="Markup %" value={form.markupPercentage} onChange={(event) => setForm({ ...form, markupPercentage: event.target.value })} />
          <input className={fieldClassName()} min="0" step="0.001" required type="number" placeholder="Ton kho" value={form.stockQuantity} onChange={(event) => setForm({ ...form, stockQuantity: event.target.value })} />
          <input className={fieldClassName()} min="0" step="0.001" required type="number" placeholder="Ton toi thieu" value={form.minimumStockQuantity} onChange={(event) => setForm({ ...form, minimumStockQuantity: event.target.value })} />
          <input className={fieldClassName()} required placeholder="Don vi" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
          <select className={fieldClassName()} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="active">Dang dung</option>
            <option value="inactive">Ngung</option>
            <option value="discontinued">Ngung ban</option>
          </select>
          <div className="flex gap-2">
            <ToolbarButton variant="primary" type="submit">{form.id ? "Cap nhat" : "Them"}</ToolbarButton>
            {form.id ? <ToolbarButton onClick={() => setForm(emptyForm)}>Huy</ToolbarButton> : null}
          </div>
          <textarea className="min-h-20 rounded-md border border-border p-3 text-sm lg:col-span-6" placeholder="Mo ta" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </form>
      ) : null}

      <FilterBar>
        <input className={fieldClassName("md:col-span-2")} placeholder="Tim ma hoac ten vat tu" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        <select className={fieldClassName()} value={filters.categoryId} onChange={(event) => setFilters({ ...filters, categoryId: event.target.value })}>
          <option value="">Tat ca nhom</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select className={fieldClassName()} value={filters.supplierId} onChange={(event) => setFilters({ ...filters, supplierId: event.target.value })}>
          <option value="">Tat ca NCC</option>
          {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
        </select>
        <select className={fieldClassName()} value={filters.stockStatus} onChange={(event) => setFilters({ ...filters, stockStatus: event.target.value })}>
          <option value="">Tat ca ton kho</option>
          <option value="low">Sap het</option>
          <option value="ok">Du ton</option>
        </select>
        <select className={fieldClassName()} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="">Tat ca trang thai</option>
          <option value="active">Dang dung</option>
          <option value="inactive">Ngung</option>
          <option value="discontinued">Ngung ban</option>
        </select>
        <ToolbarButton onClick={() => void load()}>Loc</ToolbarButton>
      </FilterBar>

      <ErrorBanner message={error} />
      {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div> : null}
      {canManage && selectedIds.length ? <ToolbarButton variant="danger" onClick={() => void handleBulkDelete()}>Ngung {selectedIds.length} vat tu</ToolbarButton> : null}

      <DataTable
        items={items}
        loading={loading}
        getRowKey={(item) => item.id}
        minWidth={1240}
        emptyTitle="Chua co vat tu"
        columns={[
          { key: "select", header: canManage ? <input checked={items.length > 0 && selectedIds.length === items.length} type="checkbox" onChange={toggleAll} /> : null, render: (item) => canManage ? <input checked={selectedSet.has(item.id)} type="checkbox" onChange={() => toggleSelected(item.id)} /> : null },
          { key: "code", header: "Ma vat tu", render: (item) => <span className="font-semibold">{item.materialCode}</span> },
          { key: "name", header: "Ten vat tu", render: (item) => item.materialName },
          { key: "category", header: "Nhom", render: (item) => item.category?.name ?? "-" },
          { key: "supplier", header: "Nha cung cap", render: (item) => item.supplier?.name ?? "-" },
          ...(canViewCost ? [
            { key: "purchase", header: "Gia mua", render: (item: InventoryItem) => formatVnd(item.purchasePrice) },
            { key: "selling", header: "Gia ban", render: (item: InventoryItem) => formatVnd(item.sellingPrice) }
          ] : []),
          { key: "stock", header: "Ton", render: (item) => `${formatNumber(item.stockQuantity, 3)} ${item.unit}` },
          { key: "min", header: "Toi thieu", render: (item) => formatNumber(item.minimumStockQuantity, 3) },
          { key: "stockStatus", header: "Tinh trang", render: (item) => Number(item.stockQuantity) <= Number(item.minimumStockQuantity) ? "Sap het" : "Du ton" },
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

function SummaryTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-white p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
