"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { FilterBar, ToolbarButton, fieldClassName } from "../../components/ui/controls";
import { DataTable } from "../../components/ui/data-table";
import { ErrorBanner } from "../../components/ui/feedback";
import { PageHeader } from "../../components/ui/page-header";
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
  fetchNextInventoryMaterialCode,
  saveInventoryCategory,
  saveInventoryItem,
  saveInventorySupplier,
  uploadInventoryItemImage
} from "./inventory-api";
import { calculateSellingPriceInput, formatInputNumber, formatNumber, formatVnd, parseFormattedNumber } from "./inventory-format";

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

const numberOrUndefined = (value: string) => parseFormattedNumber(value);
const imageSrc = (path?: string | null) => path ? (path.startsWith("http") ? path : `${apiBaseUrl}${path}`) : "";
type MaterialFormField = keyof typeof emptyMaterialForm;
type MaterialErrors = Partial<Record<MaterialFormField, string>>;

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
  const [materialErrors, setMaterialErrors] = useState<MaterialErrors>({});
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
      setError(err instanceof Error ? err.message : "Cannot load inventory data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function previewMaterialCode(categoryId: string) {
    if (!categoryId || form.id) return "";
    try {
      const response = await fetchNextInventoryMaterialCode(categoryId);
      return response.data.materialCode;
    } catch {
      return "Will be generated after saving";
    }
  }

  async function handleMaterialGroupChange(categoryId: string) {
    setForm((current) => ({ ...current, categoryId, materialCode: current.id ? current.materialCode : "" }));
    setMaterialErrors((current) => ({ ...current, categoryId: undefined }));
    const materialCode = await previewMaterialCode(categoryId);
    if (materialCode) {
      setForm((current) => current.id ? current : { ...current, materialCode });
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  }

  function resetMaterialForm() {
    setForm(emptyMaterialForm);
    setMaterialErrors({});
    setImageFile(null);
    setImagePreview("");
  }

  function edit(item: InventoryItem) {
    setForm({
      id: item.id,
      materialCode: item.materialCode,
      materialName: item.materialName,
      categoryId: item.categoryId ?? "",
      supplierId: item.supplierId ?? "",
      purchasePrice: formatInputNumber(item.purchasePrice),
      sellingPrice: formatInputNumber(item.sellingPrice),
      markupPercentage: formatInputNumber(item.markupPercentage),
      stockQuantity: formatInputNumber(item.stockQuantity),
      minimumStockQuantity: formatInputNumber(item.minimumStockQuantity),
      unit: item.unit,
      status: item.status,
      imageUrl: item.imageUrl ?? "",
      description: item.description ?? ""
    });
    setImageFile(null);
    setImagePreview("");
    setMaterialErrors({});
    setMessage("");
  }

  function clearMaterialError(field: MaterialFormField) {
    setMaterialErrors((current) => ({ ...current, [field]: undefined }));
  }

  function updateMaterialField(field: MaterialFormField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    clearMaterialError(field);
  }

  function updateMaterialNumber(field: MaterialFormField, value: string) {
    const formatted = formatInputNumber(value);
    setForm((current) => {
      const next = { ...current, [field]: formatted };
      if (field === "purchasePrice" || field === "markupPercentage") {
        next.sellingPrice = calculateSellingPriceInput(next.purchasePrice, next.markupPercentage);
      }
      return next;
    });
    clearMaterialError(field);
  }

  function materialInputClass(field: MaterialFormField, extra = "") {
    const errorClass = materialErrors[field] ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "";
    return fieldClassName(`${errorClass} ${extra}`.trim());
  }

  function validateMaterialForm() {
    const requiredFields: MaterialFormField[] = ["materialName", "categoryId", "supplierId", "purchasePrice", "markupPercentage", "unit"];
    const nextErrors = requiredFields.reduce<MaterialErrors>((errors, field) => {
      if (!String(form[field] ?? "").trim()) errors[field] = "This field is required.";
      return errors;
    }, {});
    setMaterialErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError("Please fill in all required fields.");
      return false;
    }
    return true;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!validateMaterialForm()) return;
    try {
      setError("");
      const response = await saveInventoryItem({
        materialName: form.materialName,
        categoryId: form.categoryId,
        supplierId: form.supplierId,
        purchasePrice: numberOrUndefined(form.purchasePrice),
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
      resetMaterialForm();
      setMessage("Material saved.");
      await load();
    } catch (err) {
      const details = err instanceof Error ? err.message : "Cannot save material.";
      setError(details.includes("material_code") || details.includes("Material Code already exists") ? "Material Code already exists. Please try again." : details);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Deactivate this material?")) return;
    await deleteInventoryItem(id);
    setMessage("Material deactivated.");
    await load();
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Deactivate ${selectedIds.length} selected materials?`)) return;
    const response = await bulkDeactivateInventoryItems(selectedIds);
    setSelectedIds([]);
    setMessage(`Processed ${response.data.results.length} materials.`);
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
      setMessage("Material Group saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save Material Group.");
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
      setMessage("Supplier saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save Supplier.");
    }
  }

  async function deactivateCategory(id: string) {
    if (!window.confirm("Deactivate this Material Group?")) return;
    await deleteInventoryCategory(id);
    setMessage("Material Group deactivated.");
    await load();
  }

  async function deactivateSupplier(id: string) {
    if (!window.confirm("Deactivate this Supplier?")) return;
    await deleteInventorySupplier(id);
    setMessage("Supplier deactivated.");
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
      <PageHeader title="Inventory Materials" description="Manage materials, material groups, suppliers, and material images in one workspace." />

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryTile label="Materials" value={summary?.totalItems ?? 0} />
        <SummaryTile label="Low Stock" value={summary?.lowStockItems ?? 0} />
        <SummaryTile label="Material Groups" value={summary?.activeCategories ?? 0} />
        <SummaryTile label="Stock Value" value={canViewCost ? formatVnd(summary?.stockValue ?? 0) : "***"} />
      </div>

      <div className="flex flex-wrap gap-2">
        {canManageCategories ? <ToolbarButton variant={catalogPanel === "categories" ? "primary" : "secondary"} onClick={() => setCatalogPanel(catalogPanel === "categories" ? "" : "categories")}>Manage Material Groups</ToolbarButton> : null}
        {canManageSuppliers ? <ToolbarButton variant={catalogPanel === "suppliers" ? "primary" : "secondary"} onClick={() => setCatalogPanel(catalogPanel === "suppliers" ? "" : "suppliers")}>Manage Suppliers</ToolbarButton> : null}
        {canManage && selectedIds.length ? <ToolbarButton variant="danger" onClick={() => void handleBulkDelete()}>Deactivate {selectedIds.length} Materials</ToolbarButton> : null}
      </div>

      {canManageCategories && catalogPanel === "categories" ? (
        <CatalogPanel title="Material Groups" onSubmit={submitCategory}>
          <input className={fieldClassName()} required placeholder="Code, e.g. CK" value={categoryForm.code} onChange={(event) => setCategoryForm({ ...categoryForm, code: event.target.value })} />
          <input className={fieldClassName()} required placeholder="Name, e.g. Mechanical" value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} />
          <input className={fieldClassName()} placeholder="Department" value={categoryForm.department} onChange={(event) => setCategoryForm({ ...categoryForm, department: event.target.value })} />
          <select className={fieldClassName()} value={categoryForm.status} onChange={(event) => setCategoryForm({ ...categoryForm, status: event.target.value })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <textarea className="min-h-20 rounded-md border border-border p-3 text-sm placeholder:text-gray-400 md:col-span-2" placeholder="Description" value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} />
          <CatalogActions isEditing={Boolean(categoryForm.id)} onCancel={() => setCategoryForm(emptyCategoryForm)} />
          <CompactList items={categories} onEdit={(category) => setCategoryForm({ id: category.id, code: category.code, name: category.name, department: category.department ?? "", description: category.description ?? "", status: category.status })} onDelete={deactivateCategory} />
        </CatalogPanel>
      ) : null}

      {canManageSuppliers && catalogPanel === "suppliers" ? (
        <CatalogPanel title="Suppliers" onSubmit={submitSupplier}>
          <input className={fieldClassName()} required placeholder="Supplier Code" value={supplierForm.code} onChange={(event) => setSupplierForm({ ...supplierForm, code: event.target.value })} />
          <input className={fieldClassName()} required placeholder="Supplier Name" value={supplierForm.name} onChange={(event) => setSupplierForm({ ...supplierForm, name: event.target.value })} />
          <input className={fieldClassName()} placeholder="Contact Person" value={supplierForm.contactName} onChange={(event) => setSupplierForm({ ...supplierForm, contactName: event.target.value })} />
          <input className={fieldClassName()} placeholder="Phone Number" value={supplierForm.phone} onChange={(event) => setSupplierForm({ ...supplierForm, phone: event.target.value })} />
          <input className={fieldClassName()} placeholder="Email" value={supplierForm.email} onChange={(event) => setSupplierForm({ ...supplierForm, email: event.target.value })} />
          <input className={fieldClassName()} placeholder="Tax Code" value={supplierForm.taxCode} onChange={(event) => setSupplierForm({ ...supplierForm, taxCode: event.target.value })} />
          <select className={fieldClassName()} value={supplierForm.status} onChange={(event) => setSupplierForm({ ...supplierForm, status: event.target.value })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <textarea className="min-h-20 rounded-md border border-border p-3 text-sm placeholder:text-gray-400 md:col-span-2" placeholder="Address" value={supplierForm.address} onChange={(event) => setSupplierForm({ ...supplierForm, address: event.target.value })} />
          <textarea className="min-h-20 rounded-md border border-border p-3 text-sm placeholder:text-gray-400 md:col-span-2" placeholder="Note" value={supplierForm.description} onChange={(event) => setSupplierForm({ ...supplierForm, description: event.target.value })} />
          <CatalogActions isEditing={Boolean(supplierForm.id)} onCancel={() => setSupplierForm(emptySupplierForm)} />
          <CompactList items={suppliers} onEdit={(supplier) => setSupplierForm({ id: supplier.id, code: supplier.code, name: supplier.name, contactName: supplier.contactName ?? "", phone: supplier.phone ?? "", email: supplier.email ?? "", address: supplier.address ?? "", taxCode: supplier.taxCode ?? "", description: supplier.description ?? "", status: supplier.status })} onDelete={deactivateSupplier} />
        </CatalogPanel>
      ) : null}

      {canManage ? (
        <form className="grid gap-3 rounded-md border border-border bg-white p-4 md:grid-cols-2 xl:grid-cols-12" noValidate onSubmit={(event) => void submit(event)}>
          <div className="xl:col-span-2">
            <input className={fieldClassName()} readOnly placeholder="Auto-generated after selecting Material Group" title="Material Code is auto-generated from the selected Material Group" value={form.materialCode} />
          </div>
          <div className="xl:col-span-3">
            <input className={materialInputClass("materialName")} placeholder="Material Name" value={form.materialName} onChange={(event) => updateMaterialField("materialName", event.target.value)} />
            <FieldError message={materialErrors.materialName} />
          </div>
          <div className="xl:col-span-3">
            <select className={materialInputClass("categoryId")} value={form.categoryId} onChange={(event) => void handleMaterialGroupChange(event.target.value)}>
              <option value="">Select Material Group</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.code} - {category.name}</option>)}
            </select>
            <FieldError message={materialErrors.categoryId} />
          </div>
          <div className="xl:col-span-3">
            <select className={materialInputClass("supplierId")} value={form.supplierId} onChange={(event) => updateMaterialField("supplierId", event.target.value)}>
              <option value="">Select Supplier</option>
              {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </select>
            <FieldError message={materialErrors.supplierId} />
          </div>
          <select className={fieldClassName("xl:col-span-1")} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="discontinued">Discontinued</option>
          </select>
          <div className="xl:col-span-2">
            <input className={materialInputClass("purchasePrice")} inputMode="numeric" min="0" step="1" type="text" placeholder="Purchase Price" value={form.purchasePrice} onChange={(event) => updateMaterialNumber("purchasePrice", event.target.value)} />
            <FieldError message={materialErrors.purchasePrice} />
          </div>
          <div className="xl:col-span-2">
            <input className={materialInputClass("markupPercentage")} inputMode="numeric" min="0" step="1" type="text" placeholder="Markup %" value={form.markupPercentage} onChange={(event) => updateMaterialNumber("markupPercentage", event.target.value)} />
            <FieldError message={materialErrors.markupPercentage} />
          </div>
          <input className={fieldClassName("xl:col-span-2")} inputMode="numeric" min="0" readOnly step="1" type="text" placeholder="Selling Price" value={form.sellingPrice} />
          <input className={fieldClassName("xl:col-span-2")} inputMode="numeric" min="0" step="1" type="text" placeholder="Stock Quantity" value={form.stockQuantity} onChange={(event) => updateMaterialNumber("stockQuantity", event.target.value)} />
          <input className={fieldClassName("xl:col-span-2")} inputMode="numeric" min="0" step="1" type="text" placeholder="Minimum Stock" value={form.minimumStockQuantity} onChange={(event) => updateMaterialNumber("minimumStockQuantity", event.target.value)} />
          <div className="xl:col-span-2">
            <input className={materialInputClass("unit")} placeholder="Unit" value={form.unit} onChange={(event) => updateMaterialField("unit", event.target.value)} />
            <FieldError message={materialErrors.unit} />
          </div>
          <label className="flex h-10 items-center rounded-md border border-border bg-white px-3 text-sm text-muted">
            <input accept="image/jpeg,image/png,image/webp" className="w-full text-sm" type="file" onChange={handleImageChange} />
          </label>
          <div className="flex items-center gap-3 lg:col-span-2">
            {imagePreview || form.imageUrl ? <img alt="" className="h-14 w-14 rounded-md border border-border object-cover" src={imagePreview || imageSrc(form.imageUrl)} /> : <div className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted">No image</div>}
            <div className="flex gap-2">
              <ToolbarButton variant="primary" type="submit">{form.id ? "Save" : "Add"}</ToolbarButton>
              {form.id ? <ToolbarButton onClick={resetMaterialForm}>Cancel</ToolbarButton> : null}
            </div>
          </div>
          <textarea className="min-h-20 rounded-md border border-border p-3 text-sm placeholder:text-gray-400 md:col-span-2 xl:col-span-12" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </form>
      ) : null}

      <FilterBar>
        <input className={fieldClassName("md:col-span-2")} placeholder="Search Material Code or Material Name" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        <select className={fieldClassName()} value={filters.categoryId} onChange={(event) => setFilters({ ...filters, categoryId: event.target.value })}>
          <option value="">All Material Groups</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select className={fieldClassName()} value={filters.supplierId} onChange={(event) => setFilters({ ...filters, supplierId: event.target.value })}>
          <option value="">All Suppliers</option>
          {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
        </select>
        <select className={fieldClassName()} value={filters.stockStatus} onChange={(event) => setFilters({ ...filters, stockStatus: event.target.value })}>
          <option value="">All Stock Status</option>
          <option value="low">Low Stock</option>
          <option value="ok">Enough</option>
        </select>
        <select className={fieldClassName()} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="discontinued">Discontinued</option>
        </select>
        <ToolbarButton onClick={() => void load()}>Filter</ToolbarButton>
      </FilterBar>

      <ErrorBanner message={error} />
      {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div> : null}

      <DataTable
        items={items}
        loading={loading}
        getRowKey={(item) => item.id}
        minWidth={1500}
        emptyTitle="No materials"
        emptyDescription="Add a material after creating at least one Material Group and Supplier."
        columns={[
          { key: "select", header: canManage ? <input checked={items.length > 0 && selectedIds.length === items.length} type="checkbox" onChange={toggleAll} /> : null, className: "whitespace-nowrap", render: (item) => canManage ? <input checked={selectedSet.has(item.id)} type="checkbox" onChange={() => toggleSelected(item.id)} /> : null },
          { key: "image", header: "Image", className: "whitespace-nowrap", render: (item) => item.imageUrl ? <img alt="" className="h-12 w-12 rounded-md border border-border object-cover" src={imageSrc(item.imageUrl)} /> : <div className="h-12 w-12 rounded-md border border-dashed border-border" /> },
          { key: "code", header: "Material Code", className: "whitespace-nowrap", render: (item) => <span className="font-semibold">{item.materialCode}</span> },
          { key: "name", header: "Material Name", className: "min-w-40 whitespace-nowrap", render: (item) => item.materialName },
          { key: "category", header: "Material Group", className: "min-w-36 whitespace-nowrap", render: (item) => item.category?.name ?? "-" },
          { key: "supplier", header: "Supplier", className: "min-w-36 whitespace-nowrap", render: (item) => item.supplier?.name ?? "-" },
          { key: "unit", header: "Unit", className: "whitespace-nowrap", render: (item) => item.unit },
          ...(canViewCost ? [
            { key: "purchase", header: "Purchase Price", className: "whitespace-nowrap", render: (item: InventoryItem) => formatNumber(item.purchasePrice) },
            { key: "selling", header: "Selling Price", className: "whitespace-nowrap", render: (item: InventoryItem) => formatNumber(item.sellingPrice) }
          ] : []),
          { key: "stock", header: "Stock Quantity", className: "whitespace-nowrap", render: (item) => formatNumber(item.stockQuantity) },
          { key: "min", header: "Minimum Stock", className: "whitespace-nowrap", render: (item) => formatNumber(item.minimumStockQuantity) },
          { key: "stockStatus", header: "Stock Status", className: "whitespace-nowrap", render: (item) => Number(item.stockQuantity) <= 0 ? "Out of Stock" : Number(item.stockQuantity) <= Number(item.minimumStockQuantity) ? "Low Stock" : "Enough" },
          { key: "status", header: "Status", className: "whitespace-nowrap", render: (item) => <EnglishStatusBadge value={item.status} /> },
          {
            key: "actions",
            header: "Actions",
            className: "whitespace-nowrap text-right",
            render: (item) => canManage ? (
              <div className="flex justify-end gap-3">
                <button className="font-medium text-primary" type="button" onClick={() => edit(item)}>Edit</button>
                <button className="font-medium text-red-700" type="button" onClick={() => void handleDelete(item.id)}>Delete</button>
              </div>
            ) : null
          }
        ]}
      />
    </section>
  );
}

function EnglishStatusBadge({ value }: { value: string }) {
  const label = value.replaceAll("_", " ");
  return (
    <span className="inline-flex max-w-full items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
      <span className="truncate">{label}</span>
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs font-medium text-red-600">{message}</p> : null;
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
      <ToolbarButton variant="primary" type="submit">{isEditing ? "Save" : "Add"}</ToolbarButton>
      {isEditing ? <ToolbarButton onClick={onCancel}>Cancel</ToolbarButton> : null}
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
            <button className="font-medium text-primary" type="button" onClick={() => onEdit(item)}>Edit</button>
            <button className="font-medium text-red-700" type="button" onClick={() => void onDelete(item.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
