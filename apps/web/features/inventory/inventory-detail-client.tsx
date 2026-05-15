"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ToolbarButton, fieldClassName } from "../../components/ui/controls";
import { DataTable } from "../../components/ui/data-table";
import { ErrorBanner } from "../../components/ui/feedback";
import { PageHeader } from "../../components/ui/page-header";
import { getStoredUser, hasPermission } from "../../lib/auth";
import type { InventoryItem } from "../../types/inventory";
import { createInventoryMovement, fetchInventoryItem } from "./inventory-api";
import { formatNumber, formatVnd, statusLabel } from "./inventory-format";

export function InventoryDetailClient({ id }: { id: string }) {
  const [item, setItem] = useState<InventoryItem>();
  const [form, setForm] = useState({ movementType: "receipt", direction: "increase", quantity: "", unitCost: "", note: "" });
  const [error, setError] = useState("");
  const user = getStoredUser();
  const canAdjust = hasPermission(user, "inventory.adjust_stock");
  const canViewCost = hasPermission(user, "inventory.view_cost");

  async function load() {
    try {
      const response = await fetchInventoryItem(id);
      setItem(response.data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load material");
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await createInventoryMovement(id, {
        movementType: form.movementType,
        direction: form.movementType === "adjustment" ? form.direction : undefined,
        quantity: Number(form.quantity),
        unitCost: form.unitCost ? Number(form.unitCost) : undefined,
        note: form.note || undefined
      });
      setForm({ movementType: "receipt", direction: "increase", quantity: "", unitCost: "", note: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot adjust stock");
    }
  }

  if (!item) {
    return <ErrorBanner message={error || "Loading material..."} />;
  }

  return (
    <section className="space-y-4">
      <PageHeader
        title={item.materialName}
        description={`${item.materialCode} - Stock Quantity: ${formatNumber(item.stockQuantity, 3)} ${item.unit}`}
        actions={<Link className="rounded-md border border-border px-4 py-2 text-sm font-semibold" href={`/inventory/items/${item.id}/edit`}>Edit</Link>}
      />
      <ErrorBanner message={error} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-md border border-border bg-white p-4 lg:col-span-2">
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <Info label="Material Code" value={item.materialCode} />
            <Info label="Material Name" value={item.materialName} />
            <Info label="Material Group" value={item.category?.name ?? "-"} />
            <Info label="Supplier" value={item.supplier?.name ?? "-"} />
            <Info label="Purchase Price" value={canViewCost ? formatVnd(item.purchasePrice) : "***"} />
            <Info label="Selling Price" value={canViewCost ? formatVnd(item.sellingPrice) : "***"} />
            <Info label="Markup" value={canViewCost ? `${formatNumber(item.markupPercentage, 2)}%` : "***"} />
            <Info label="Status" value={statusLabel(item.status)} />
            <Info label="Description" value={item.description ?? "-"} />
          </dl>
        </div>

        {canAdjust ? (
          <form className="rounded-md border border-border bg-white p-4" onSubmit={(event) => void submit(event)}>
            <h2 className="mb-3 text-base font-semibold">Update Stock</h2>
            <div className="space-y-3">
              <select className={`${fieldClassName()} w-full`} value={form.movementType} onChange={(event) => setForm({ ...form, movementType: event.target.value })}>
                <option value="receipt">Receipt</option>
                <option value="issue">Issue</option>
                <option value="adjustment">Adjustment</option>
              </select>
              {form.movementType === "adjustment" ? (
                <select className={`${fieldClassName()} w-full`} value={form.direction} onChange={(event) => setForm({ ...form, direction: event.target.value })}>
                  <option value="increase">Increase</option>
                  <option value="decrease">Decrease</option>
                </select>
              ) : null}
              <input className={`${fieldClassName()} w-full`} min="0" step="0.001" required type="number" placeholder="Quantity" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} />
              <input className={`${fieldClassName()} w-full`} min="0" step="1" type="number" placeholder="Unit Cost" value={form.unitCost} onChange={(event) => setForm({ ...form, unitCost: event.target.value })} />
              <textarea className="min-h-20 w-full rounded-md border border-border p-3 text-sm" placeholder="Note" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
              <ToolbarButton variant="primary" type="submit">Save Stock</ToolbarButton>
            </div>
          </form>
        ) : null}
      </div>

      <DataTable
        items={item.movements ?? []}
        getRowKey={(movement) => movement.id}
        emptyTitle="No stock history"
        columns={[
          { key: "date", header: "Date", render: (movement) => new Date(movement.createdAt).toLocaleString("en-US") },
          { key: "type", header: "Type", render: (movement) => statusLabel(movement.movementType) },
          { key: "qty", header: "Quantity", render: (movement) => formatNumber(movement.quantity, 3) },
          { key: "before", header: "Previous Stock", render: (movement) => formatNumber(movement.previousStock, 3) },
          { key: "after", header: "Resulting Stock", render: (movement) => formatNumber(movement.resultingStock, 3) },
          { key: "note", header: "Note", render: (movement) => movement.note ?? "-" }
        ]}
      />
    </section>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
