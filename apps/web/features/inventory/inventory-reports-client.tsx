"use client";

import { useEffect, useState } from "react";
import { DataTable } from "../../components/ui/data-table";
import { ErrorBanner } from "../../components/ui/feedback";
import { PageHeader } from "../../components/ui/page-header";
import type { InventoryItem, InventorySummary } from "../../types/inventory";
import { fetchInventoryItems, fetchInventorySummary } from "./inventory-api";
import { formatNumber, formatVnd } from "./inventory-format";

export function InventoryReportsClient() {
  const [summary, setSummary] = useState<InventorySummary>();
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [summaryResponse, lowStockResponse] = await Promise.all([
          fetchInventorySummary(),
          fetchInventoryItems({ lowStock: true, pageSize: 100 })
        ]);
        setSummary(summaryResponse.data);
        setLowStock(lowStockResponse.data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Cannot load inventory reports");
      }
    }

    void load();
  }, []);

  return (
    <section className="space-y-4">
      <PageHeader title="Inventory Reports" description="Inventory overview and materials that need replenishment." />
      <ErrorBanner message={error} />
      <div className="grid gap-3 md:grid-cols-4">
        <Tile label="Materials" value={summary?.totalItems ?? 0} />
        <Tile label="Low Stock" value={summary?.lowStockItems ?? 0} />
        <Tile label="Material Groups" value={summary?.activeCategories ?? 0} />
        <Tile label="Stock Value" value={formatVnd(summary?.stockValue ?? 0)} />
      </div>
      <DataTable
        items={lowStock}
        getRowKey={(item) => item.id}
        emptyTitle="No low-stock materials"
        columns={[
          { key: "code", header: "Material Code", render: (item) => item.materialCode },
          { key: "name", header: "Material Name", render: (item) => item.materialName },
          { key: "stock", header: "Stock Quantity", render: (item) => `${formatNumber(item.stockQuantity, 3)} ${item.unit}` },
          { key: "min", header: "Minimum Stock", render: (item) => formatNumber(item.minimumStockQuantity, 3) },
          { key: "supplier", header: "Supplier", render: (item) => item.supplier?.name ?? "-" }
        ]}
      />
    </section>
  );
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-white p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
