"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Search, Trash2, Upload } from "lucide-react";
import { FilterBar, ToolbarButton, fieldClassName } from "../../components/ui/controls";
import { DataTable } from "../../components/ui/data-table";
import { ErrorBanner, InfoBanner } from "../../components/ui/feedback";
import { fetchInventoryItems } from "../inventory/inventory-api";
import { fetchProjects } from "../projects/projects-api";
import type { InventoryItem } from "../../types/inventory";
import type { Project } from "../../types/projects";
import type { Quotation, QuotationFormItem } from "../../types/quotations";
import { fetchNextQuotationCode, saveQuotation, uploadQuotationImage, uploadQuotationSignature } from "./quotations-api";
import { formatMoney, formatNumberInput, parseNumber, toDateInput } from "./quotation-format";

const emptyItem: QuotationFormItem = {
  materialId: "",
  materialCode: "",
  materialName: "",
  unit: "",
  quantity: "",
  unitPrice: ""
};

const statuses = ["draft", "sent", "accepted", "rejected", "cancelled"];

function normalizeNumberInput(value: string) {
  const cleaned = value.replace(/[^\d.,]/g, "").replace(/,/g, "");
  if (cleaned === "") return "";
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? formatNumberInput(parsed) : "";
}

export function QuotationForm({ quotation, onSaved }: { quotation?: Quotation; onSaved?: (quotation: Quotation) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialSuggestions, setMaterialSuggestions] = useState<InventoryItem[]>([]);
  const [searchingMaterials, setSearchingMaterials] = useState(false);
  const [form, setForm] = useState({
    projectId: quotation?.projectId ?? "",
    quotationCode: quotation?.quotationCode ?? "",
    customerName: quotation?.customerName ?? "",
    customerRequest: quotation?.customerRequest ?? "",
    quotationDate: toDateInput(quotation?.quotationDate),
    numberOfSets: formatNumberInput(quotation?.numberOfSets ?? 1),
    vatEnabled: quotation?.vatEnabled ?? false,
    vatRate: formatNumberInput(quotation?.vatRate ?? 10),
    status: quotation?.status ?? "draft"
  });
  const [items, setItems] = useState<QuotationFormItem[]>(
    quotation?.items.map((item) => ({
      materialId: item.materialId ?? "",
      materialCode: item.materialCodeSnapshot,
      materialName: item.materialNameSnapshot,
      unit: item.unitSnapshot,
      quantity: formatNumberInput(item.quantity),
      unitPrice: formatNumberInput(item.unitPrice)
    })) ?? []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProjects({ pageSize: 100 })
      .then((response) => setProjects(response.data.items))
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    if (quotation?.id) return;
    fetchNextQuotationCode(form.quotationDate)
      .then((response) => setForm((current) => ({ ...current, quotationCode: response.data.quotationCode })))
      .catch(() => setForm((current) => ({ ...current, quotationCode: "Generated after saving" })));
  }, [form.quotationDate, quotation?.id]);

  useEffect(() => {
    const query = materialSearch.trim();
    if (!query) {
      setMaterialSuggestions([]);
      return;
    }
    setSearchingMaterials(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetchInventoryItems({ search: query, status: "active", pageSize: 10 });
        setMaterialSuggestions(response.data.items);
      } catch {
        setMaterialSuggestions([]);
      } finally {
        setSearchingMaterials(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [materialSearch]);

  const totals = useMemo(() => {
    const subtotalOneSet = items.reduce((sum, item) => {
      const quantity = parseNumber(item.quantity) ?? 0;
      const unitPrice = parseNumber(item.unitPrice) ?? 0;
      return sum + quantity * unitPrice;
    }, 0);
    const numberOfSets = parseNumber(form.numberOfSets) ?? 0;
    const totalBeforeVat = subtotalOneSet * numberOfSets;
    const vatRate = parseNumber(form.vatRate) ?? 0;
    const vatAmount = form.vatEnabled ? totalBeforeVat * vatRate / 100 : 0;
    return { subtotalOneSet, totalBeforeVat, vatAmount, grandTotal: totalBeforeVat + vatAmount };
  }, [form.numberOfSets, form.vatEnabled, form.vatRate, items]);

  function updateField(name: string, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function handleProjectChange(projectId: string) {
    const project = projects.find((item) => item.id === projectId);
    setForm((current) => ({
      ...current,
      projectId,
      customerName: project?.customerName ?? current.customerName
    }));
    setErrors((current) => ({ ...current, projectId: "", customerName: "" }));
  }

  function addMaterial(material: InventoryItem) {
    if (items.some((item) => item.materialId === material.id)) {
      setMessage("This material is already in the quotation.");
      return;
    }
    setItems((current) => [
      ...current,
      {
        ...emptyItem,
        materialId: material.id,
        materialCode: material.materialCode,
        materialName: material.materialName,
        unit: material.unit,
        unitPrice: formatNumberInput(material.sellingPrice)
      }
    ]);
    setMaterialSearch("");
    setMaterialSuggestions([]);
    setErrors((current) => ({ ...current, items: "" }));
  }

  function updateItem(index: number, field: keyof QuotationFormItem, value: string) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
    setErrors((current) => ({ ...current, [`item-${index}-${field}`]: "" }));
  }

  function validate() {
    const nextErrors: Record<string, string> = {};
    if (!form.customerName.trim()) nextErrors.customerName = "Customer Name is required.";
    if (!form.quotationDate) nextErrors.quotationDate = "Quotation Date is required.";
    if ((parseNumber(form.numberOfSets) ?? 0) <= 0) nextErrors.numberOfSets = "Number of Sets must be greater than 0.";
    if (form.vatEnabled && (parseNumber(form.vatRate) ?? -1) < 0) nextErrors.vatRate = "VAT Rate must be non-negative.";
    if (items.length === 0) nextErrors.items = "At least one material item is required.";
    items.forEach((item, index) => {
      if ((parseNumber(item.quantity) ?? 0) <= 0) nextErrors[`item-${index}-quantity`] = "Quantity must be greater than 0.";
      if ((parseNumber(item.unitPrice) ?? -1) < 0) nextErrors[`item-${index}-unitPrice`] = "Unit Price must be non-negative.";
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!validate()) {
      setError("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        projectId: form.projectId || undefined,
        customerName: form.customerName.trim(),
        customerRequest: form.customerRequest.trim() || undefined,
        quotationDate: form.quotationDate,
        numberOfSets: parseNumber(form.numberOfSets),
        vatEnabled: form.vatEnabled,
        vatRate: parseNumber(form.vatRate) ?? 0,
        status: form.status,
        items: items.map((item) => ({
          materialId: item.materialId,
          quantity: parseNumber(item.quantity),
          unitPrice: parseNumber(item.unitPrice)
        }))
      };
      let response = await saveQuotation(payload, quotation?.id);
      const saved = response.data;

      if (imageFiles?.length) {
        for (const file of Array.from(imageFiles)) {
          await uploadQuotationImage(saved.id, file);
        }
      }
      if (signatureFile) {
        response = await uploadQuotationSignature(saved.id, signatureFile);
      }

      setMessage(quotation?.id ? "Quotation updated successfully." : "Quotation created successfully.");
      onSaved?.(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save quotation.");
    } finally {
      setSaving(false);
    }
  }

  const errorClass = (key: string) => errors[key] ? "border-red-400 focus:border-red-500 focus:ring-red-100" : "";

  return (
    <form className="space-y-5" onSubmit={(event) => void submit(event)}>
      <ErrorBanner message={error} />
      <InfoBanner message={message} />

      <div className="grid gap-4 rounded-md border border-border bg-white p-4 lg:grid-cols-4">
        <label className="text-sm font-medium">
          Project
          <select className={`mt-1 w-full ${fieldClassName()}`} value={form.projectId} onChange={(event) => handleProjectChange(event.target.value)}>
            <option value="">Customer-only quotation</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.projectCode} - {project.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">
          Quotation Code
          <input className={`mt-1 w-full ${fieldClassName("border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed")}`} value={form.quotationCode} readOnly placeholder="Generated after saving" />
        </label>
        <Field label="Customer Name" error={errors.customerName}>
          <input className={`w-full ${fieldClassName(errorClass("customerName"))}`} value={form.customerName} onChange={(event) => updateField("customerName", event.target.value)} placeholder="Customer Name" />
        </Field>
        <Field label="Quotation Date" error={errors.quotationDate}>
          <input className={`w-full ${fieldClassName(errorClass("quotationDate"))}`} type="date" value={form.quotationDate} onChange={(event) => updateField("quotationDate", event.target.value)} />
        </Field>
        <Field label="Number of Sets" error={errors.numberOfSets}>
          <input className={`w-full ${fieldClassName(errorClass("numberOfSets"))}`} value={form.numberOfSets} onChange={(event) => updateField("numberOfSets", normalizeNumberInput(event.target.value))} placeholder="Number of Sets" />
        </Field>
        <label className="flex items-center gap-2 pt-7 text-sm font-medium">
          <input type="checkbox" checked={form.vatEnabled} onChange={(event) => updateField("vatEnabled", event.target.checked)} />
          Include VAT
        </label>
        <Field label="VAT Rate %" error={errors.vatRate}>
          <input className={`w-full ${fieldClassName(errorClass("vatRate"))}`} value={form.vatRate} onChange={(event) => updateField("vatRate", normalizeNumberInput(event.target.value))} placeholder="VAT Rate" />
        </Field>
        <label className="text-sm font-medium">
          Status
          <select className={`mt-1 w-full ${fieldClassName()}`} value={form.status} onChange={(event) => updateField("status", event.target.value)}>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium lg:col-span-4">
          Customer Request
          <textarea className="mt-1 min-h-24 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/15" value={form.customerRequest} onChange={(event) => updateField("customerRequest", event.target.value)} placeholder="Customer Request" />
        </label>
      </div>

      <section className="space-y-3 rounded-md border border-border bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <label className="relative block flex-1 text-sm font-medium">
            Search Inventory Material
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 text-muted" size={16} />
              <input className={`w-full pl-9 ${fieldClassName()}`} value={materialSearch} onChange={(event) => setMaterialSearch(event.target.value)} placeholder="Search by Material Code or Material Name" />
            </div>
            {materialSearch ? (
              <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-white shadow-lg">
                {searchingMaterials ? <div className="p-3 text-sm text-muted">Searching...</div> : null}
                {!searchingMaterials && materialSuggestions.length === 0 ? <div className="p-3 text-sm text-muted">No materials found.</div> : null}
                {materialSuggestions.map((material) => (
                  <button key={material.id} className="block w-full px-3 py-2 text-left text-sm hover:bg-surface" type="button" onClick={() => addMaterial(material)}>
                    <span className="font-medium">{material.materialCode}</span> - {material.materialName} - {formatMoney(material.sellingPrice)} / {material.unit}
                  </button>
                ))}
              </div>
            ) : null}
          </label>
          <div className="text-sm font-semibold text-ink">{items.length} item(s)</div>
        </div>
        <ErrorBanner message={errors.items} />
        <DataTable
          items={items}
          minWidth={960}
          getRowKey={(item, index) => `${item.materialId}-${index}`}
          emptyTitle="No quotation items"
          emptyDescription="Search and add inventory materials to build this quotation."
          columns={[
            { key: "index", header: "#", render: (_item, index) => index + 1 },
            { key: "code", header: "Material Code", render: (item) => <span className="whitespace-nowrap font-medium">{item.materialCode}</span> },
            { key: "name", header: "Material Name", render: (item) => item.materialName },
            { key: "quantity", header: "Quantity", render: (item, index) => <LineInput value={item.quantity} error={errors[`item-${index}-quantity`]} onChange={(value) => updateItem(index, "quantity", normalizeNumberInput(value))} /> },
            { key: "unit", header: "Unit", render: (item) => <span className="whitespace-nowrap">{item.unit}</span> },
            { key: "unitPrice", header: "Unit Price", render: (item, index) => <LineInput value={item.unitPrice} error={errors[`item-${index}-unitPrice`]} onChange={(value) => updateItem(index, "unitPrice", normalizeNumberInput(value))} /> },
            { key: "amount", header: "Amount", className: "text-right whitespace-nowrap", render: (item) => formatMoney((parseNumber(item.quantity) ?? 0) * (parseNumber(item.unitPrice) ?? 0)) },
            { key: "actions", header: "Actions", className: "whitespace-nowrap", render: (_item, index) => <ToolbarButton variant="danger" className="h-8 px-2" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={14} />Remove</ToolbarButton> }
          ]}
        />
      </section>

      <section className="grid gap-4 rounded-md border border-border bg-white p-4 md:grid-cols-2">
        <label className="text-sm font-medium">
          Images
          <input className={`mt-1 w-full ${fieldClassName("py-2")}`} type="file" accept=".jpg,.jpeg,.png,.webp" multiple onChange={(event: ChangeEvent<HTMLInputElement>) => setImageFiles(event.target.files)} />
        </label>
        <label className="text-sm font-medium">
          Signature Image
          <input className={`mt-1 w-full ${fieldClassName("py-2")}`} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(event: ChangeEvent<HTMLInputElement>) => setSignatureFile(event.target.files?.[0] ?? null)} />
        </label>
      </section>

      <section className="grid gap-3 rounded-md border border-border bg-white p-4 md:grid-cols-4">
        <Summary label="Subtotal for 1 Set" value={totals.subtotalOneSet} />
        <Summary label="Total Before VAT" value={totals.totalBeforeVat} />
        <Summary label="VAT Amount" value={totals.vatAmount} />
        <Summary label="Grand Total" value={totals.grandTotal} strong />
      </section>

      <div className="flex justify-end gap-2">
        <ToolbarButton variant="primary" type="submit" disabled={saving}>
          <Upload size={16} />
          {saving ? "Saving..." : quotation?.id ? "Save Changes" : "Create Quotation"}
        </ToolbarButton>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="text-sm font-medium">
      {label}
      <div className="mt-1">{children}</div>
      {error ? <div className="mt-1 text-xs text-red-600">{error}</div> : null}
    </label>
  );
}

function LineInput({ value, error, onChange }: { value: string; error?: string; onChange: (value: string) => void }) {
  return (
    <div>
      <input className={`w-28 text-right ${fieldClassName(error ? "border-red-400" : "")}`} value={value} onChange={(event) => onChange(event.target.value)} placeholder="0" />
      {error ? <div className="mt-1 w-32 text-xs text-red-600">{error}</div> : null}
    </div>
  );
}

function Summary({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="text-xs font-medium uppercase text-muted">{label}</div>
      <div className={`mt-1 text-lg ${strong ? "font-bold text-primary" : "font-semibold text-ink"}`}>{formatMoney(value)}</div>
    </div>
  );
}
