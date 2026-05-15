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
      <PageHeader title="Bao cao kho vat tu" description="Tong quan ton kho va danh sach vat tu can bo sung." />
      <ErrorBanner message={error} />
      <div className="grid gap-3 md:grid-cols-4">
        <Tile label="Vat tu" value={summary?.totalItems ?? 0} />
        <Tile label="Sap het" value={summary?.lowStockItems ?? 0} />
        <Tile label="Nhom vat tu" value={summary?.activeCategories ?? 0} />
        <Tile label="Gia tri ton" value={formatVnd(summary?.stockValue ?? 0)} />
      </div>
      <DataTable
        items={lowStock}
        getRowKey={(item) => item.id}
        emptyTitle="Khong co vat tu sap het"
        columns={[
          { key: "code", header: "Ma", render: (item) => item.materialCode },
          { key: "name", header: "Ten vat tu", render: (item) => item.materialName },
          { key: "stock", header: "Ton", render: (item) => `${formatNumber(item.stockQuantity, 3)} ${item.unit}` },
          { key: "min", header: "Toi thieu", render: (item) => formatNumber(item.minimumStockQuantity, 3) },
          { key: "supplier", header: "Nha cung cap", render: (item) => item.supplier?.name ?? "-" }
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
