"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { FilterBar, ToolbarButton, fieldClassName } from "../../components/ui/controls";
import { DataTable } from "../../components/ui/data-table";
import { ErrorBanner } from "../../components/ui/feedback";
import { PageHeader } from "../../components/ui/page-header";
import { StatusBadge } from "../../components/ui/status-badge";
import { apiBaseUrl } from "../../lib/api-client";
import { getStoredUser, hasPermission } from "../../lib/auth";
import type { InventoryCategory, InventoryItem, InventorySummary, InventorySupplier } from "../../types/inventory";
import {
  bulkDeactivateInventoryItems,
  deleteInventoryCategory,
  deleteInventoryItem,
  deleteInventorySupplier,
  fetchInventoryCategories,
  fetchInventoryItems,
  fetchInventorySummary,
  fetchInventorySuppliers,
  saveInventoryCategory,
  saveInventoryItem,
  saveInventorySupplier,
  uploadInventoryItemImage
} from "./inventory-api";
import { formatNumber, formatVnd } from "./inventory-format";

const emptyMaterialForm = {
  id: "",
  materialCode: "",
  materialName: "",
  categoryId: "",
  supplierId: "",
  purchasePrice: "",
  sellingPrice: "",
  markupPercentage: "",
  stockQuantity: "",
  minimumStockQuantity: "",
  unit: "",
  status: "active",
  imageUrl: "",
  description: ""
};

const emptyCategoryForm = {
  id: "",
  code: "",
  name: "",
  department: "",
  description: "",
  status: "active"
};

const emptySupplierForm = {
  id: "",
  code: "",
  name: "",
  contactName: "",
  phone: "",
  email: "",
  address: "",
  taxCode: "",
  description: "",
  status: "active"
};

type CatalogPanel = "categories" | "suppliers" | "";

const numberOrUndefined = (value: string) => value.trim() === "" ? undefined : Number(value);
const imageSrc = (path?: string | null) => path ? (path.startsWith("http") ? path : `${apiBaseUrl}${path}`) : "";

export function InventoryClient() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([]);
  const [summary, setSummary] = useState<InventorySummary>();
  const [filters, setFilters] = useState({ search: "", categoryId: "", supplierId: "", status: "", stockStatus: "" });
  const [form, setForm] = useState(emptyMaterialForm);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [supplierForm, setSupplierForm] = useState(emptySupplierForm);
  const [catalogPanel, setCatalogPanel] = useState<CatalogPanel>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const user = getStoredUser();
  const canManage = hasPermission(user, "inventory.manage");
  const canManageCategories = hasPermission(user, "inventory.categories.manage");
  const canManageSuppliers = hasPermission(user, "inventory.suppliers.manage");
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

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  }

  function edit(item: InventoryItem) {
    setForm({
      id: item.id,
      materialCode: item.materialCode,
      materialName: item.materialName,
      categoryId: item.categoryId ?? "",
      supplierId: item.supplierId ?? "",
      purchasePrice: item.purchasePrice === null || item.purchasePrice === undefined ? "" : String(item.purchasePrice),
      sellingPrice: item.sellingPrice === null || item.sellingPrice === undefined ? "" : String(item.sellingPrice),
      markupPercentage: item.markupPercentage === null || item.markupPercentage === undefined ? "" : String(item.markupPercentage),
      stockQuantity: item.stockQuantity === null || item.stockQuantity === undefined ? "" : String(item.stockQuantity),
      minimumStockQuantity: item.minimumStockQuantity === null || item.minimumStockQuantity === undefined ? "" : String(item.minimumStockQuantity),
      unit: item.unit,
      status: item.status,
      imageUrl: item.imageUrl ?? "",
      description: item.description ?? ""
    });
    setImageFile(null);
    setImagePreview("");
    setMessage("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const response = await saveInventoryItem({
        materialCode: form.materialCode,
        materialName: form.materialName,
        categoryId: form.categoryId,
        supplierId: form.supplierId,
        purchasePrice: numberOrUndefined(form.purchasePrice),
        sellingPrice: numberOrUndefined(form.sellingPrice),
        markupPercentage: numberOrUndefined(form.markupPercentage),
        stockQuantity: numberOrUndefined(form.stockQuantity),
        minimumStockQuantity: numberOrUndefined(form.minimumStockQuantity),
        unit: form.unit,
        status: form.status,
        imageUrl: form.imageUrl || undefined,
        description: form.description || undefined
      }, form.id || undefined);
      if (imageFile) {
        await uploadInventoryItemImage(response.data.id, imageFile);
      }
      setForm(emptyMaterialForm);
      setImageFile(null);
      setImagePreview("");
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

  async function submitCategory(event: FormEvent) {
    event.preventDefault();
    try {
      await saveInventoryCategory({
        code: categoryForm.code,
        name: categoryForm.name,
        department: categoryForm.department || undefined,
        description: categoryForm.description || undefined,
        status: categoryForm.status
      }, categoryForm.id || undefined);
      setCategoryForm(emptyCategoryForm);
      setMessage("Da luu nhom vat tu.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save category");
    }
  }

  async function submitSupplier(event: FormEvent) {
    event.preventDefault();
    try {
      await saveInventorySupplier({
        code: supplierForm.code,
        name: supplierForm.name,
        contactName: supplierForm.contactName || undefined,
        phone: supplierForm.phone || undefined,
        email: supplierForm.email || undefined,
        address: supplierForm.address || undefined,
        taxCode: supplierForm.taxCode || undefined,
        description: supplierForm.description || undefined,
        status: supplierForm.status
      }, supplierForm.id || undefined);
      setSupplierForm(emptySupplierForm);
      setMessage("Da luu nha cung cap.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save supplier");
    }
  }

  async function deactivateCategory(id: string) {
    if (!window.confirm("Ngung nhom vat tu nay?")) return;
    await deleteInventoryCategory(id);
    setMessage("Da ngung nhom vat tu.");
    await load();
  }

  async function deactivateSupplier(id: string) {
    if (!window.confirm("Ngung nha cung cap nay?")) return;
    await deleteInventorySupplier(id);
    setMessage("Da ngung nha cung cap.");
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
      <PageHeader title="Kho vat tu" description="Quan ly vat tu, nhom vat tu, nha cung cap va hinh anh trong mot man hinh." />

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryTile label="Vat tu" value={summary?.totalItems ?? 0} />
        <SummaryTile label="Sap het" value={summary?.lowStockItems ?? 0} />
        <SummaryTile label="Nhom vat tu" value={summary?.activeCategories ?? 0} />
        <SummaryTile label="Gia tri ton" value={canViewCost ? formatVnd(summary?.stockValue ?? 0) : "***"} />
      </div>

      <div className="flex flex-wrap gap-2">
        {canManageCategories ? <ToolbarButton variant={catalogPanel === "categories" ? "primary" : "secondary"} onClick={() => setCatalogPanel(catalogPanel === "categories" ? "" : "categories")}>Quan ly nhom</ToolbarButton> : null}
        {canManageSuppliers ? <ToolbarButton variant={catalogPanel === "suppliers" ? "primary" : "secondary"} onClick={() => setCatalogPanel(catalogPanel === "suppliers" ? "" : "suppliers")}>Quan ly NCC</ToolbarButton> : null}
        {canManage && selectedIds.length ? <ToolbarButton variant="danger" onClick={() => void handleBulkDelete()}>Ngung {selectedIds.length} vat tu</ToolbarButton> : null}
      </div>

      {canManageCategories && catalogPanel === "categories" ? (
        <CatalogPanel title="Nhom vat tu" onSubmit={submitCategory}>
          <input className={fieldClassName()} required placeholder="Code, e.g. CK" value={categoryForm.code} onChange={(event) => setCategoryForm({ ...categoryForm, code: event.target.value })} />
          <input className={fieldClassName()} required placeholder="Name, e.g. Mechanical" value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} />
          <input className={fieldClassName()} placeholder="Department" value={categoryForm.department} onChange={(event) => setCategoryForm({ ...categoryForm, department: event.target.value })} />
          <select className={fieldClassName()} value={categoryForm.status} onChange={(event) => setCategoryForm({ ...categoryForm, status: event.target.value })}>
            <option value="active">Dang dung</option>
            <option value="inactive">Ngung</option>
          </select>
          <textarea className="min-h-20 rounded-md border border-border p-3 text-sm placeholder:text-gray-400 md:col-span-2" placeholder="Description" value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} />
          <CatalogActions isEditing={Boolean(categoryForm.id)} onCancel={() => setCategoryForm(emptyCategoryForm)} />
          <CompactList items={categories} onEdit={(category) => setCategoryForm({ id: category.id, code: category.code, name: category.name, department: category.department ?? "", description: category.description ?? "", status: category.status })} onDelete={deactivateCategory} />
        </CatalogPanel>
      ) : null}

      {canManageSuppliers && catalogPanel === "suppliers" ? (
        <CatalogPanel title="Nha cung cap" onSubmit={submitSupplier}>
          <input className={fieldClassName()} required placeholder="Supplier code" value={supplierForm.code} onChange={(event) => setSupplierForm({ ...supplierForm, code: event.target.value })} />
          <input className={fieldClassName()} required placeholder="Supplier name" value={supplierForm.name} onChange={(event) => setSupplierForm({ ...supplierForm, name: event.target.value })} />
          <input className={fieldClassName()} placeholder="Contact person" value={supplierForm.contactName} onChange={(event) => setSupplierForm({ ...supplierForm, contactName: event.target.value })} />
          <input className={fieldClassName()} placeholder="Phone number" value={supplierForm.phone} onChange={(event) => setSupplierForm({ ...supplierForm, phone: event.target.value })} />
          <input className={fieldClassName()} placeholder="Email" value={supplierForm.email} onChange={(event) => setSupplierForm({ ...supplierForm, email: event.target.value })} />
          <input className={fieldClassName()} placeholder="Tax code" value={supplierForm.taxCode} onChange={(event) => setSupplierForm({ ...supplierForm, taxCode: event.target.value })} />
          <select className={fieldClassName()} value={supplierForm.status} onChange={(event) => setSupplierForm({ ...supplierForm, status: event.target.value })}>
            <option value="active">Dang dung</option>
            <option value="inactive">Ngung</option>
          </select>
          <textarea className="min-h-20 rounded-md border border-border p-3 text-sm placeholder:text-gray-400 md:col-span-2" placeholder="Address" value={supplierForm.address} onChange={(event) => setSupplierForm({ ...supplierForm, address: event.target.value })} />
          <textarea className="min-h-20 rounded-md border border-border p-3 text-sm placeholder:text-gray-400 md:col-span-2" placeholder="Note" value={supplierForm.description} onChange={(event) => setSupplierForm({ ...supplierForm, description: event.target.value })} />
          <CatalogActions isEditing={Boolean(supplierForm.id)} onCancel={() => setSupplierForm(emptySupplierForm)} />
          <CompactList items={suppliers} onEdit={(supplier) => setSupplierForm({ id: supplier.id, code: supplier.code, name: supplier.name, contactName: supplier.contactName ?? "", phone: supplier.phone ?? "", email: supplier.email ?? "", address: supplier.address ?? "", taxCode: supplier.taxCode ?? "", description: supplier.description ?? "", status: supplier.status })} onDelete={deactivateSupplier} />
        </CatalogPanel>
      ) : null}

      {canManage ? (
        <form className="grid gap-3 rounded-md border border-border bg-white p-4 lg:grid-cols-6" onSubmit={(event) => void submit(event)}>
          <input className={fieldClassName()} required placeholder="Material code" value={form.materialCode} onChange={(event) => setForm({ ...form, materialCode: event.target.value })} />
          <input className={fieldClassName()} required placeholder="Material name" value={form.materialName} onChange={(event) => setForm({ ...form, materialName: event.target.value })} />
          <select className={fieldClassName()} required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
            <option value="">Material group</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.code} - {category.name}</option>)}
          </select>
          <select className={fieldClassName()} required value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })}>
            <option value="">Supplier</option>
            {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
          </select>
          <input className={fieldClassName()} min="0" step="1" type="number" placeholder="Purchase price" value={form.purchasePrice} onChange={(event) => setForm({ ...form, purchasePrice: event.target.value })} />
          <input className={fieldClassName()} min="0" step="1" type="number" placeholder="Selling price" value={form.sellingPrice} onChange={(event) => setForm({ ...form, sellingPrice: event.target.value })} />
          <input className={fieldClassName()} min="0" step="0.01" type="number" placeholder="Markup %" value={form.markupPercentage} onChange={(event) => setForm({ ...form, markupPercentage: event.target.value })} />
          <input className={fieldClassName()} min="0" step="0.001" type="number" placeholder="Stock quantity" value={form.stockQuantity} onChange={(event) => setForm({ ...form, stockQuantity: event.target.value })} />
          <input className={fieldClassName()} min="0" step="0.001" type="number" placeholder="Minimum stock" value={form.minimumStockQuantity} onChange={(event) => setForm({ ...form, minimumStockQuantity: event.target.value })} />
          <input className={fieldClassName()} required placeholder="Unit" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
          <select className={fieldClassName()} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="active">Dang dung</option>
            <option value="inactive">Ngung</option>
            <option value="discontinued">Ngung ban</option>
          </select>
          <label className="flex h-10 items-center rounded-md border border-border bg-white px-3 text-sm text-muted">
            <input accept="image/jpeg,image/png,image/webp" className="w-full text-sm" type="file" onChange={handleImageChange} />
          </label>
          <div className="flex items-center gap-3 lg:col-span-2">
            {imagePreview || form.imageUrl ? <img alt="" className="h-14 w-14 rounded-md border border-border object-cover" src={imagePreview || imageSrc(form.imageUrl)} /> : <div className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted">No image</div>}
            <div className="flex gap-2">
              <ToolbarButton variant="primary" type="submit">{form.id ? "Cap nhat" : "Them"}</ToolbarButton>
              {form.id ? <ToolbarButton onClick={() => { setForm(emptyMaterialForm); setImageFile(null); setImagePreview(""); }}>Huy</ToolbarButton> : null}
            </div>
          </div>
          <textarea className="min-h-20 rounded-md border border-border p-3 text-sm placeholder:text-gray-400 lg:col-span-6" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </form>
      ) : null}

      <FilterBar>
        <input className={fieldClassName("md:col-span-2")} placeholder="Search material code or name" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        <select className={fieldClassName()} value={filters.categoryId} onChange={(event) => setFilters({ ...filters, categoryId: event.target.value })}>
          <option value="">All groups</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select className={fieldClassName()} value={filters.supplierId} onChange={(event) => setFilters({ ...filters, supplierId: event.target.value })}>
          <option value="">All suppliers</option>
          {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
        </select>
        <select className={fieldClassName()} value={filters.stockStatus} onChange={(event) => setFilters({ ...filters, stockStatus: event.target.value })}>
          <option value="">All stock</option>
          <option value="low">Low stock</option>
          <option value="ok">In stock</option>
        </select>
        <select className={fieldClassName()} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="">All status</option>
          <option value="active">Dang dung</option>
          <option value="inactive">Ngung</option>
          <option value="discontinued">Ngung ban</option>
        </select>
        <ToolbarButton onClick={() => void load()}>Loc</ToolbarButton>
      </FilterBar>

      <ErrorBanner message={error} />
      {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div> : null}

      <DataTable
        items={items}
        loading={loading}
        getRowKey={(item) => item.id}
        minWidth={1360}
        emptyTitle="Chua co vat tu"
        columns={[
          { key: "select", header: canManage ? <input checked={items.length > 0 && selectedIds.length === items.length} type="checkbox" onChange={toggleAll} /> : null, render: (item) => canManage ? <input checked={selectedSet.has(item.id)} type="checkbox" onChange={() => toggleSelected(item.id)} /> : null },
          { key: "image", header: "Hinh", render: (item) => item.imageUrl ? <img alt="" className="h-12 w-12 rounded-md border border-border object-cover" src={imageSrc(item.imageUrl)} /> : <div className="h-12 w-12 rounded-md border border-dashed border-border" /> },
          { key: "code", header: "Ma vat tu", render: (item) => <span className="font-semibold">{item.materialCode}</span> },
          { key: "name", header: "Ten vat tu", render: (item) => item.materialName },
          { key: "category", header: "Nhom", render: (item) => item.category?.name ?? "-" },
          { key: "supplier", header: "Nha cung cap", render: (item) => item.supplier?.name ?? "-" },
          { key: "unit", header: "Don vi", render: (item) => item.unit },
          ...(canViewCost ? [
            { key: "purchase", header: "Gia mua", render: (item: InventoryItem) => formatVnd(item.purchasePrice) },
            { key: "selling", header: "Gia ban", render: (item: InventoryItem) => formatVnd(item.sellingPrice) }
          ] : []),
          { key: "stock", header: "Ton", render: (item) => formatNumber(item.stockQuantity, 3) },
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

function CatalogPanel({ title, children, onSubmit }: { title: string; children: ReactNode; onSubmit: (event: FormEvent) => void }) {
  return (
    <form className="grid gap-3 rounded-md border border-border bg-white p-4 md:grid-cols-2" onSubmit={(event) => void onSubmit(event)}>
      <div className="text-sm font-semibold md:col-span-2">{title}</div>
      {children}
    </form>
  );
}

function CatalogActions({ isEditing, onCancel }: { isEditing: boolean; onCancel: () => void }) {
  return (
    <div className="flex gap-2">
      <ToolbarButton variant="primary" type="submit">{isEditing ? "Cap nhat" : "Them"}</ToolbarButton>
      {isEditing ? <ToolbarButton onClick={onCancel}>Huy</ToolbarButton> : null}
    </div>
  );
}

function CompactList<T extends { id: string; code: string; name: string; status: string }>({ items, onEdit, onDelete }: { items: T[]; onEdit: (item: T) => void; onDelete: (id: string) => void }) {
  return (
    <div className="max-h-60 overflow-auto rounded-md border border-border md:col-span-2">
      {items.map((item) => (
        <div className="flex items-center justify-between border-b border-border px-3 py-2 text-sm last:border-b-0" key={item.id}>
          <div>
            <span className="font-semibold">{item.code}</span> - {item.name} <span className="text-muted">({item.status})</span>
          </div>
          <div className="flex gap-3">
            <button className="font-medium text-primary" type="button" onClick={() => onEdit(item)}>Sua</button>
            <button className="font-medium text-red-700" type="button" onClick={() => void onDelete(item.id)}>Ngung</button>
          </div>
        </div>
      ))}
    </div>
  );
}
