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
      <PageHeader title="Lich su kho" description="Theo doi nhap, xuat va dieu chinh ton kho vat tu." />
      <FilterBar>
        <input className={fieldClassName("md:col-span-2")} placeholder="Tim ma hoac ten vat tu" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        <select className={fieldClassName()} value={filters.movementType} onChange={(event) => setFilters({ ...filters, movementType: event.target.value })}>
          <option value="">Tat ca loai</option>
          <option value="receipt">Nhap</option>
          <option value="issue">Xuat</option>
          <option value="adjustment">Dieu chinh</option>
          <option value="return">Tra lai</option>
          <option value="reservation">Giu hang</option>
          <option value="release">Bo giu</option>
        </select>
        <ToolbarButton onClick={() => void load()}>Loc</ToolbarButton>
      </FilterBar>
      <ErrorBanner message={error} />
      <DataTable
        items={items}
        getRowKey={(item) => item.id}
        minWidth={920}
        emptyTitle="Chua co giao dich kho"
        columns={[
          { key: "date", header: "Ngay", render: (item) => new Date(item.createdAt).toLocaleString("vi-VN") },
          { key: "code", header: "Ma vat tu", render: (item) => item.item?.materialCode ?? item.itemId },
          { key: "name", header: "Ten vat tu", render: (item) => item.item?.materialName ?? "-" },
          { key: "type", header: "Loai", render: (item) => statusLabel(item.movementType) },
          { key: "qty", header: "So luong", render: (item) => `${formatNumber(item.quantity, 3)} ${item.item?.unit ?? ""}` },
          { key: "cost", header: "Don gia", render: (item) => item.unitCost ? formatVnd(item.unitCost) : "-" },
          { key: "after", header: "Ton sau", render: (item) => formatNumber(item.resultingStock, 3) },
          { key: "note", header: "Ghi chu", render: (item) => item.note ?? "-" }
        ]}
      />
    </section>
  );
}
