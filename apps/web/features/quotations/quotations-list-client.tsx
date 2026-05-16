"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Download, Eye, FilePlus, Pencil, Settings, Trash2, Upload } from "lucide-react";
import { FilterBar, ToolbarButton, fieldClassName } from "../../components/ui/controls";
import { DataTable } from "../../components/ui/data-table";
import { ErrorBanner, InfoBanner } from "../../components/ui/feedback";
import { PageHeader } from "../../components/ui/page-header";
import { StatusBadge } from "../../components/ui/status-badge";
import { getStoredUser, hasPermission } from "../../lib/auth";
import type { Quotation } from "../../types/quotations";
import { deleteQuotation, downloadQuotationExcel, fetchQuotations } from "./quotations-api";
import { formatMoney, statusLabel, toDateInput } from "./quotation-format";

export function QuotationsListClient() {
  const user = getStoredUser();
  const canView = hasPermission(user, "quotations.view");
  const canManage = hasPermission(user, "quotations.manage");
  const canDelete = hasPermission(user, "quotations.delete");
  const canExport = hasPermission(user, "quotations.export");
  const [items, setItems] = useState<Quotation[]>([]);
  const [filters, setFilters] = useState({ search: "", status: "", dateFrom: "", dateTo: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetchQuotations({ ...filters, pageSize: 50 });
      setItems(response.data.items);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load quotations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canView) void load();
  }, [canView]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await load();
  }

  async function remove(item: Quotation) {
    if (!window.confirm(`Deactivate quotation ${item.quotationCode}?`)) return;
    try {
      await deleteQuotation(item.id);
      setMessage("Quotation deactivated successfully.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot deactivate quotation.");
    }
  }

  async function exportExcel(item: Quotation) {
    try {
      await downloadQuotationExcel(item.id, item.quotationCode);
      setMessage("Quotation exported successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot export quotation.");
    }
  }

  if (!canView) {
    return <div className="rounded-md border border-border bg-white p-5 text-sm text-muted">You do not have permission to view quotations.</div>;
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Quotations"
        description="Create customer quotations from inventory materials, calculate VAT totals, and export Excel files."
        actions={
          <div className="flex flex-wrap gap-2">
            {canManage ? <Link href="/quotations/new"><ToolbarButton variant="primary"><FilePlus size={16} />Create Quotation</ToolbarButton></Link> : null}
            {canManage ? <Link href="/quotations/templates"><ToolbarButton><Upload size={16} />Templates</ToolbarButton></Link> : null}
            {canManage ? <Link href="/quotations/settings"><ToolbarButton><Settings size={16} />Company Settings</ToolbarButton></Link> : null}
          </div>
        }
      />
      <ErrorBanner message={error} />
      <InfoBanner message={message} />
      <form onSubmit={(event) => void submit(event)}>
        <FilterBar>
          <label className="text-sm font-medium">
            Search
            <input className={`mt-1 w-full ${fieldClassName()}`} value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Code, project, or customer" />
          </label>
          <label className="text-sm font-medium">
            Status
            <select className={`mt-1 w-full ${fieldClassName()}`} value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="">All statuses</option>
              {["draft", "sent", "approved", "rejected", "cancelled"].map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">
            Date From
            <input className={`mt-1 w-full ${fieldClassName()}`} type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} />
          </label>
          <label className="text-sm font-medium">
            Date To
            <input className={`mt-1 w-full ${fieldClassName()}`} type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} />
          </label>
          <ToolbarButton className="mt-6" type="submit">Search</ToolbarButton>
        </FilterBar>
      </form>

      <DataTable
        items={items}
        loading={loading}
        minWidth={980}
        getRowKey={(item) => item.id}
        emptyTitle="No quotations"
        emptyDescription="Create the first quotation to start tracking customer pricing."
        columns={[
          { key: "code", header: "Quotation Code", className: "whitespace-nowrap", render: (item) => <span className="font-semibold">{item.quotationCode}</span> },
          { key: "date", header: "Date", className: "whitespace-nowrap", render: (item) => toDateInput(item.quotationDate) },
          { key: "type", header: "Type", className: "whitespace-nowrap", render: (item) => item.quotationType === "project" ? "Project" : "Commercial" },
          { key: "project", header: "Project", render: (item) => item.project ? `${item.project.projectCode} - ${item.project.name}` : "-" },
          { key: "customer", header: "Customer", render: (item) => item.customerName },
          { key: "sets", header: "Sets", className: "text-right whitespace-nowrap", render: (item) => item.numberOfSets },
          { key: "total", header: "Grand Total", className: "text-right whitespace-nowrap", render: (item) => formatMoney(item.grandTotal) },
          { key: "status", header: "Status", className: "whitespace-nowrap", render: (item) => <StatusBadge value={item.status} /> },
          {
            key: "actions",
            header: "Actions",
            className: "whitespace-nowrap",
            render: (item) => (
              <div className="flex flex-nowrap gap-2">
                <Link className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs font-semibold hover:bg-surface" href={`/quotations/${item.id}`}><Eye size={14} />View</Link>
                {canManage ? <Link className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs font-semibold hover:bg-surface" href={`/quotations/${item.id}/edit`}><Pencil size={14} />Edit</Link> : null}
                {canExport ? <ToolbarButton className="h-8 px-2 text-xs" onClick={() => void exportExcel(item)}><Download size={14} />Excel</ToolbarButton> : null}
                {canDelete ? <ToolbarButton variant="danger" className="h-8 px-2 text-xs" onClick={() => void remove(item)}><Trash2 size={14} />Delete</ToolbarButton> : null}
              </div>
            )
          }
        ]}
      />
    </section>
  );
}
