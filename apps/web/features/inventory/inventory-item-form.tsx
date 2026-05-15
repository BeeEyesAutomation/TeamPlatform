"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { fieldClassName } from "../../components/ui/controls";
import { ErrorBanner } from "../../components/ui/feedback";
import type { InventoryCategory, InventorySupplier } from "../../types/inventory";
import { fetchInventoryCategories, fetchInventoryItem, fetchInventorySuppliers, fetchNextInventoryMaterialCode, saveInventoryItem } from "./inventory-api";

const initialForm = {
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
  description: ""
};

export function InventoryItemForm({ id }: { id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([]);
  const [error, setError] = useState("");

  const numberOrUndefined = (value: string) => value.trim() === "" ? undefined : Number(value);

  useEffect(() => {
    async function load() {
      try {
        const [categoriesResponse, suppliersResponse] = await Promise.all([
          fetchInventoryCategories({ pageSize: 100, status: "active" }),
          fetchInventorySuppliers({ pageSize: 100, status: "active" })
        ]);
        setCategories(categoriesResponse.data.items);
        setSuppliers(suppliersResponse.data.items);

        if (id) {
          const response = await fetchInventoryItem(id);
          setForm({
            materialCode: response.data.materialCode,
            materialName: response.data.materialName,
            categoryId: response.data.categoryId ?? "",
            supplierId: response.data.supplierId ?? "",
            purchasePrice: String(response.data.purchasePrice ?? 0),
            sellingPrice: String(response.data.sellingPrice ?? 0),
            markupPercentage: String(response.data.markupPercentage ?? 0),
            stockQuantity: String(response.data.stockQuantity ?? 0),
            minimumStockQuantity: String(response.data.minimumStockQuantity ?? 0),
            unit: response.data.unit,
            status: response.data.status,
            description: response.data.description ?? ""
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Cannot load material form");
      }
    }

    void load();
  }, [id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await saveInventoryItem({
        materialName: form.materialName,
        purchasePrice: numberOrUndefined(form.purchasePrice),
        sellingPrice: numberOrUndefined(form.sellingPrice),
        markupPercentage: numberOrUndefined(form.markupPercentage),
        stockQuantity: numberOrUndefined(form.stockQuantity),
        minimumStockQuantity: numberOrUndefined(form.minimumStockQuantity),
        categoryId: form.categoryId || undefined,
        supplierId: form.supplierId || undefined,
        unit: form.unit,
        status: form.status,
        description: form.description || undefined
      }, id);
      router.push("/inventory");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save material");
    }
  }

  async function handleCategoryChange(categoryId: string) {
    setForm((current) => ({ ...current, categoryId, materialCode: id ? current.materialCode : "" }));
    if (!categoryId || id) return;
    try {
      const response = await fetchNextInventoryMaterialCode(categoryId);
      setForm((current) => ({ ...current, materialCode: response.data.materialCode }));
    } catch {
      setForm((current) => ({ ...current, materialCode: "Will be generated after saving" }));
    }
  }

  return (
    <form className="max-w-4xl space-y-4 rounded-md border border-border bg-white p-5" onSubmit={(event) => void submit(event)}>
      <ErrorBanner message={error} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Material Code" readOnly placeholder="Auto-generated after selecting Material Group" value={form.materialCode} onChange={() => undefined} />
        <Field label="Material Name" required value={form.materialName} onChange={(value) => setForm({ ...form, materialName: value })} />
        <label className="block text-sm font-medium">
          Material Group
          <select className={`${fieldClassName()} mt-1 w-full`} required value={form.categoryId} onChange={(event) => void handleCategoryChange(event.target.value)}>
            <option value="">Select Material Group</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Supplier
          <select className={`${fieldClassName()} mt-1 w-full`} required value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })}>
            <option value="">Select Supplier</option>
            {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
          </select>
        </label>
        <Field label="Purchase Price" type="number" value={form.purchasePrice} onChange={(value) => setForm({ ...form, purchasePrice: value })} />
        <Field label="Selling Price" type="number" value={form.sellingPrice} onChange={(value) => setForm({ ...form, sellingPrice: value })} />
        <Field label="Markup %" type="number" value={form.markupPercentage} onChange={(value) => setForm({ ...form, markupPercentage: value })} />
        <Field label="Stock Quantity" type="number" value={form.stockQuantity} onChange={(value) => setForm({ ...form, stockQuantity: value })} />
        <Field label="Minimum Stock" type="number" value={form.minimumStockQuantity} onChange={(value) => setForm({ ...form, minimumStockQuantity: value })} />
        <Field label="Unit" required value={form.unit} onChange={(value) => setForm({ ...form, unit: value })} />
        <label className="block text-sm font-medium">
          Status
          <select className={`${fieldClassName()} mt-1 w-full`} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="discontinued">Discontinued</option>
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium">
        Description
        <textarea className="mt-1 min-h-24 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
      </label>
      <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" type="submit">Save</button>
    </form>
  );
}

function Field({ label, value, onChange, required, readOnly, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; readOnly?: boolean; placeholder?: string; type?: string }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input className={`${fieldClassName()} mt-1 w-full`} min={type === "number" ? 0 : undefined} placeholder={placeholder} readOnly={readOnly} step={type === "number" ? "0.001" : undefined} required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
