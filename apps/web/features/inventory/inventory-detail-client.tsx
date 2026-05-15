"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ToolbarButton, fieldClassName } from "../../components/ui/controls";
import { DataTable } from "../../components/ui/data-table";
import { ErrorBanner } from "../../components/ui/feedback";
import { PageHeader } from "../../components/ui/page-header";
import { StatusBadge } from "../../components/ui/status-badge";
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
    return <ErrorBanner message={error || "Dang tai vat tu..."} />;
  }

  return (
    <section className="space-y-4">
      <PageHeader
        title={item.materialName}
        description={`${item.materialCode} - Ton kho: ${formatNumber(item.stockQuantity, 3)} ${item.unit}`}
        actions={<Link className="rounded-md border border-border px-4 py-2 text-sm font-semibold" href={`/inventory/items/${item.id}/edit`}>Sua</Link>}
      />
      <ErrorBanner message={error} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-md border border-border bg-white p-4 lg:col-span-2">
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <Info label="Ma vat tu" value={item.materialCode} />
            <Info label="Ten vat tu" value={item.materialName} />
            <Info label="Nhom" value={item.category?.name ?? "-"} />
            <Info label="Nha cung cap" value={item.supplier?.name ?? "-"} />
            <Info label="Gia mua" value={canViewCost ? formatVnd(item.purchasePrice) : "***"} />
            <Info label="Gia ban" value={canViewCost ? formatVnd(item.sellingPrice) : "***"} />
            <Info label="Markup" value={canViewCost ? `${formatNumber(item.markupPercentage, 2)}%` : "***"} />
            <Info label="Trang thai" value={<StatusBadge value={item.status} />} />
            <Info label="Mo ta" value={item.description ?? "-"} />
          </dl>
        </div>

        {canAdjust ? (
          <form className="rounded-md border border-border bg-white p-4" onSubmit={(event) => void submit(event)}>
            <h2 className="mb-3 text-base font-semibold">Cap nhat ton kho</h2>
            <div className="space-y-3">
              <select className={`${fieldClassName()} w-full`} value={form.movementType} onChange={(event) => setForm({ ...form, movementType: event.target.value })}>
                <option value="receipt">Nhap kho</option>
                <option value="issue">Xuat kho</option>
                <option value="adjustment">Dieu chinh</option>
              </select>
              {form.movementType === "adjustment" ? (
                <select className={`${fieldClassName()} w-full`} value={form.direction} onChange={(event) => setForm({ ...form, direction: event.target.value })}>
                  <option value="increase">Tang</option>
                  <option value="decrease">Giam</option>
                </select>
              ) : null}
              <input className={`${fieldClassName()} w-full`} min="0" step="0.001" required type="number" placeholder="So luong" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} />
              <input className={`${fieldClassName()} w-full`} min="0" step="1" type="number" placeholder="Don gia" value={form.unitCost} onChange={(event) => setForm({ ...form, unitCost: event.target.value })} />
              <textarea className="min-h-20 w-full rounded-md border border-border p-3 text-sm" placeholder="Ghi chu" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
              <ToolbarButton variant="primary" type="submit">Luu ton kho</ToolbarButton>
            </div>
          </form>
        ) : null}
      </div>

      <DataTable
        items={item.movements ?? []}
        getRowKey={(movement) => movement.id}
        emptyTitle="Chua co lich su ton kho"
        columns={[
          { key: "date", header: "Ngay", render: (movement) => new Date(movement.createdAt).toLocaleString("vi-VN") },
          { key: "type", header: "Loai", render: (movement) => statusLabel(movement.movementType) },
          { key: "qty", header: "So luong", render: (movement) => formatNumber(movement.quantity, 3) },
          { key: "before", header: "Truoc", render: (movement) => formatNumber(movement.previousStock, 3) },
          { key: "after", header: "Sau", render: (movement) => formatNumber(movement.resultingStock, 3) },
          { key: "note", header: "Ghi chu", render: (movement) => movement.note ?? "-" }
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
