"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { fieldClassName } from "../../components/ui/controls";
import { ErrorBanner } from "../../components/ui/feedback";
import type { InventoryCategory, InventorySupplier } from "../../types/inventory";
import { fetchInventoryCategories, fetchInventoryItem, fetchInventorySuppliers, saveInventoryItem } from "./inventory-api";

const initialForm = {
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

export function InventoryItemForm({ id }: { id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([]);
  const [error, setError] = useState("");

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
        ...form,
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
        markupPercentage: Number(form.markupPercentage),
        stockQuantity: Number(form.stockQuantity),
        minimumStockQuantity: Number(form.minimumStockQuantity),
        categoryId: form.categoryId || undefined,
        supplierId: form.supplierId || undefined
      }, id);
      router.push("/inventory");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save material");
    }
  }

  return (
    <form className="max-w-4xl space-y-4 rounded-md border border-border bg-white p-5" onSubmit={(event) => void submit(event)}>
      <ErrorBanner message={error} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Ma vat tu" required value={form.materialCode} onChange={(value) => setForm({ ...form, materialCode: value })} />
        <Field label="Ten vat tu" required value={form.materialName} onChange={(value) => setForm({ ...form, materialName: value })} />
        <label className="block text-sm font-medium">
          Nhom vat tu
          <select className={`${fieldClassName()} mt-1 w-full`} value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
            <option value="">Chua chon</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Nha cung cap
          <select className={`${fieldClassName()} mt-1 w-full`} value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })}>
            <option value="">Chua chon</option>
            {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
          </select>
        </label>
        <Field label="Gia mua" type="number" required value={form.purchasePrice} onChange={(value) => setForm({ ...form, purchasePrice: value })} />
        <Field label="Gia ban" type="number" required value={form.sellingPrice} onChange={(value) => setForm({ ...form, sellingPrice: value })} />
        <Field label="Markup (%)" type="number" required value={form.markupPercentage} onChange={(value) => setForm({ ...form, markupPercentage: value })} />
        <Field label="Ton kho" type="number" required value={form.stockQuantity} onChange={(value) => setForm({ ...form, stockQuantity: value })} />
        <Field label="Ton toi thieu" type="number" required value={form.minimumStockQuantity} onChange={(value) => setForm({ ...form, minimumStockQuantity: value })} />
        <Field label="Don vi" required value={form.unit} onChange={(value) => setForm({ ...form, unit: value })} />
        <label className="block text-sm font-medium">
          Trang thai
          <select className={`${fieldClassName()} mt-1 w-full`} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="active">Dang dung</option>
            <option value="inactive">Ngung</option>
            <option value="discontinued">Ngung ban</option>
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium">
        Mo ta
        <textarea className="mt-1 min-h-24 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
      </label>
      <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" type="submit">Luu</button>
    </form>
  );
}

function Field({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input className={`${fieldClassName()} mt-1 w-full`} min={type === "number" ? 0 : undefined} step={type === "number" ? "0.001" : undefined} required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
