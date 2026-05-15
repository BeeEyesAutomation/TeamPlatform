"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FilterBar, ToolbarButton, fieldClassName } from "../../components/ui/controls";
import { DataTable } from "../../components/ui/data-table";
import { ErrorBanner } from "../../components/ui/feedback";
import { PageHeader } from "../../components/ui/page-header";
import { StatusBadge } from "../../components/ui/status-badge";
import { getStoredUser, hasPermission } from "../../lib/auth";
import type { InventoryCategory, InventoryItem, InventorySummary, InventorySupplier } from "../../types/inventory";
import { deleteInventoryItem, fetchInventoryCategories, fetchInventoryItems, fetchInventorySummary, fetchInventorySuppliers } from "./inventory-api";
import { formatNumber, formatVnd } from "./inventory-format";

export function InventoryClient() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([]);
  const [summary, setSummary] = useState<InventorySummary>();
  const [filters, setFilters] = useState({ search: "", categoryId: "", supplierId: "", status: "", lowStock: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const user = getStoredUser();
  const canManage = hasPermission(user, "inventory.manage");
  const canViewCost = hasPermission(user, "inventory.view_cost");

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

  async function handleDelete(id: string) {
    if (!window.confirm("Ngung hoat dong vat tu nay?")) return;
    await deleteInventoryItem(id);
    await load();
  }

  return (
    <section className="space-y-4">
      <PageHeader
        title="Kho vat tu"
        description="Quan ly ma vat tu, ten vat tu, nha cung cap, gia, ton kho va dinh muc toi thieu."
        actions={canManage ? (
          <Link className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" href="/inventory/items/new">
            Tao vat tu
          </Link>
        ) : null}
      />

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryTile label="Vat tu" value={summary?.totalItems ?? 0} />
        <SummaryTile label="Sap het" value={summary?.lowStockItems ?? 0} />
        <SummaryTile label="Nhom vat tu" value={summary?.activeCategories ?? 0} />
        <SummaryTile label="Gia tri ton" value={canViewCost ? formatVnd(summary?.stockValue ?? 0) : "***"} />
      </div>

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
        <select className={fieldClassName()} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="">Tat ca trang thai</option>
          <option value="active">Dang dung</option>
          <option value="inactive">Ngung</option>
          <option value="discontinued">Ngung ban</option>
        </select>
        <select className={fieldClassName()} value={filters.lowStock} onChange={(event) => setFilters({ ...filters, lowStock: event.target.value })}>
          <option value="">Tat ca ton kho</option>
          <option value="true">Sap het</option>
        </select>
        <ToolbarButton onClick={() => void load()}>Loc</ToolbarButton>
      </FilterBar>

      <ErrorBanner message={error} />

      <DataTable
        items={items}
        loading={loading}
        getRowKey={(item) => item.id}
        minWidth={1120}
        emptyTitle="Chua co vat tu"
        columns={[
          { key: "code", header: "Ma vat tu", render: (item) => <Link className="font-semibold text-primary" href={`/inventory/items/${item.id}`}>{item.materialCode}</Link> },
          { key: "name", header: "Ten vat tu", render: (item) => item.materialName },
          { key: "category", header: "Nhom", render: (item) => item.category?.name ?? "-" },
          { key: "supplier", header: "Nha cung cap", render: (item) => item.supplier?.name ?? "-" },
          ...(canViewCost ? [
            { key: "purchase", header: "Gia mua", render: (item: InventoryItem) => formatVnd(item.purchasePrice) },
            { key: "selling", header: "Gia ban", render: (item: InventoryItem) => formatVnd(item.sellingPrice) },
            { key: "markup", header: "Markup", render: (item: InventoryItem) => `${formatNumber(item.markupPercentage, 2)}%` }
          ] : []),
          { key: "stock", header: "Ton", render: (item) => `${formatNumber(item.stockQuantity, 3)} ${item.unit}` },
          { key: "min", header: "Toi thieu", render: (item) => formatNumber(item.minimumStockQuantity, 3) },
          { key: "status", header: "Trang thai", render: (item) => <StatusBadge value={item.status} /> },
          {
            key: "actions",
            header: "",
            className: "text-right",
            render: (item) => canManage ? (
              <div className="flex justify-end gap-3">
                <Link className="font-medium text-primary" href={`/inventory/items/${item.id}/edit`}>Sua</Link>
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
