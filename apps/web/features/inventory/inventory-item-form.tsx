"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { fieldClassName } from "../../components/ui/controls";
import { ErrorBanner } from "../../components/ui/feedback";
import type { InventoryCategory, InventorySupplier } from "../../types/inventory";
import { fetchInventoryCategories, fetchInventoryItem, fetchInventorySuppliers, fetchNextInventoryMaterialCode, saveInventoryItem } from "./inventory-api";
import { calculateSellingPriceInput, formatInputNumber, parseFormattedNumber } from "./inventory-format";

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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof initialForm, string>>>({});

  const numberOrUndefined = (value: string) => parseFormattedNumber(value);

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
            purchasePrice: formatInputNumber(response.data.purchasePrice),
            sellingPrice: formatInputNumber(response.data.sellingPrice),
            markupPercentage: formatInputNumber(response.data.markupPercentage),
            stockQuantity: formatInputNumber(response.data.stockQuantity),
            minimumStockQuantity: formatInputNumber(response.data.minimumStockQuantity),
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
    if (!validate()) return;
    try {
      setError("");
      await saveInventoryItem({
        materialName: form.materialName,
        purchasePrice: numberOrUndefined(form.purchasePrice),
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
    setFieldErrors((current) => ({ ...current, categoryId: undefined }));
    if (!categoryId || id) return;
    try {
      const response = await fetchNextInventoryMaterialCode(categoryId);
      setForm((current) => ({ ...current, materialCode: response.data.materialCode }));
    } catch {
      setForm((current) => ({ ...current, materialCode: "Will be generated after saving" }));
    }
  }

  function setField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function setNumericField(field: keyof typeof initialForm, value: string) {
    const formatted = formatInputNumber(value);
    setForm((current) => {
      const next = { ...current, [field]: formatted };
      if (field === "purchasePrice" || field === "markupPercentage") {
        next.sellingPrice = calculateSellingPriceInput(next.purchasePrice, next.markupPercentage);
      }
      return next;
    });
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate() {
    const requiredFields: (keyof typeof initialForm)[] = ["materialName", "categoryId", "supplierId", "purchasePrice", "markupPercentage", "unit"];
    const nextErrors = requiredFields.reduce<Partial<Record<keyof typeof initialForm, string>>>((errors, field) => {
      if (!String(form[field] ?? "").trim()) errors[field] = "This field is required.";
      return errors;
    }, {});
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError("Please fill in all required fields.");
      return false;
    }
    return true;
  }

  return (
    <form className="max-w-6xl rounded-md border border-border bg-white p-5" noValidate onSubmit={(event) => void submit(event)}>
      <ErrorBanner message={error} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="block text-sm font-medium">
          Material Group
          <select className={`${fieldClassName(fieldErrors.categoryId ? "w-full border-red-500 focus:border-red-500 focus:ring-red-500/20" : "w-full")} mt-1`} value={form.categoryId} onChange={(event) => void handleCategoryChange(event.target.value)}>
            <option value="">Select Material Group</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <FieldError message={fieldErrors.categoryId} />
        </label>
        <Field label="Material Code" readOnly placeholder="Auto-generated after selecting Material Group" value={form.materialCode} onChange={() => undefined} />
        <Field error={fieldErrors.materialName} label="Material Name" value={form.materialName} onChange={(value) => setField("materialName", value)} />
        <label className="block text-sm font-medium">
          Supplier
          <select className={`${fieldClassName(fieldErrors.supplierId ? "w-full border-red-500 focus:border-red-500 focus:ring-red-500/20" : "w-full")} mt-1`} value={form.supplierId} onChange={(event) => setField("supplierId", event.target.value)}>
            <option value="">Select Supplier</option>
            {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
          </select>
          <FieldError message={fieldErrors.supplierId} />
        </label>
        <Field error={fieldErrors.purchasePrice} inputMode="numeric" label="Purchase Price" placeholder="Purchase Price" value={form.purchasePrice} onChange={(value) => setNumericField("purchasePrice", value)} />
        <Field error={fieldErrors.markupPercentage} inputMode="numeric" label="Markup %" placeholder="Markup %" value={form.markupPercentage} onChange={(value) => setNumericField("markupPercentage", value)} />
        <Field inputMode="numeric" label="Selling Price" placeholder="Selling Price" readOnly value={form.sellingPrice} onChange={() => undefined} />
        <Field error={fieldErrors.unit} label="Unit" placeholder="Unit" value={form.unit} onChange={(value) => setField("unit", value)} />
        <Field inputMode="numeric" label="Stock Quantity" placeholder="Stock Quantity" value={form.stockQuantity} onChange={(value) => setNumericField("stockQuantity", value)} />
        <Field inputMode="numeric" label="Minimum Stock" placeholder="Minimum Stock" value={form.minimumStockQuantity} onChange={(value) => setNumericField("minimumStockQuantity", value)} />
        <label className="block text-sm font-medium">
          Status
          <select className={`${fieldClassName()} mt-1 w-full`} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="discontinued">Discontinued</option>
          </select>
          <FieldError />
        </label>
        <label className="block text-sm font-medium sm:col-span-2 xl:col-span-4">
        Description
          <textarea className="mt-1 min-h-28 w-full rounded-md border border-border px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <FieldError />
        </label>
      </div>
      <div className="mt-5 flex justify-end border-t border-border pt-4">
        <button className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white" type="submit">Save</button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  readOnly,
  placeholder,
  error,
  inputMode
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  error?: string;
  inputMode?: "text" | "numeric" | "decimal";
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        className={`${fieldClassName(`${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""} ${readOnly ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed placeholder:text-gray-400" : ""}`)} mt-1 w-full`}
        inputMode={inputMode}
        min={inputMode ? 0 : undefined}
        placeholder={placeholder}
        readOnly={readOnly}
        step={inputMode ? 1 : undefined}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldError message={error} />
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  return <p className={`mt-1 min-h-4 text-xs font-medium ${message ? "text-red-600" : "text-transparent"}`}>{message ?? "."}</p>;
}
