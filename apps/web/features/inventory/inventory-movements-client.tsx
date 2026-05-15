"use client";

import { useEffect, useState } from "react";
import { FilterBar, ToolbarButton, fieldClassName } from "../../components/ui/controls";
import { DataTable } from "../../components/ui/data-table";
import { ErrorBanner } from "../../components/ui/feedback";
import { PageHeader } from "../../components/ui/page-header";
import type { InventoryStockMovement } from "../../types/inventory";
import { fetchInventoryMovements } from "./inventory-api";
import { formatNumber, formatVnd, statusLabel } from "./inventory-format";

export function InventoryMovementsClient() {
  const [items, setItems] = useState<InventoryStockMovement[]>([]);
  const [filters, setFilters] = useState({ search: "", movementType: "" });
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await fetchInventoryMovements(filters);
      setItems(response.data.items);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load movements");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="space-y-4">
      <PageHeader title="Inventory Movements" description="Track material receipts, issues, and stock adjustments." />
      <FilterBar>
        <input className={fieldClassName("md:col-span-2")} placeholder="Search Material Code or Material Name" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        <select className={fieldClassName()} value={filters.movementType} onChange={(event) => setFilters({ ...filters, movementType: event.target.value })}>
          <option value="">All Movement Types</option>
          <option value="receipt">Receipt</option>
          <option value="issue">Issue</option>
          <option value="adjustment">Adjustment</option>
          <option value="return">Return</option>
          <option value="reservation">Reservation</option>
          <option value="release">Release</option>
        </select>
        <ToolbarButton onClick={() => void load()}>Filter</ToolbarButton>
      </FilterBar>
      <ErrorBanner message={error} />
      <DataTable
        items={items}
        getRowKey={(item) => item.id}
        minWidth={920}
        emptyTitle="No inventory movements"
        columns={[
          { key: "date", header: "Date", render: (item) => new Date(item.createdAt).toLocaleString("en-US") },
          { key: "code", header: "Material Code", render: (item) => item.item?.materialCode ?? item.itemId },
          { key: "name", header: "Material Name", render: (item) => item.item?.materialName ?? "-" },
          { key: "type", header: "Type", render: (item) => statusLabel(item.movementType) },
          { key: "qty", header: "Quantity", render: (item) => `${formatNumber(item.quantity, 3)} ${item.item?.unit ?? ""}` },
          { key: "cost", header: "Unit Cost", render: (item) => item.unitCost ? formatVnd(item.unitCost) : "-" },
          { key: "after", header: "Resulting Stock", render: (item) => formatNumber(item.resultingStock, 3) },
          { key: "note", header: "Note", render: (item) => item.note ?? "-" }
        ]}
      />
    </section>
  );
}
