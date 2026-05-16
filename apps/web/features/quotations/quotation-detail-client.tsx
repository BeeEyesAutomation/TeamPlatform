"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Download, Pencil } from "lucide-react";
import { ToolbarButton } from "../../components/ui/controls";
import { DataTable } from "../../components/ui/data-table";
import { ErrorBanner, InfoBanner } from "../../components/ui/feedback";
import { PageHeader } from "../../components/ui/page-header";
import { StatusBadge } from "../../components/ui/status-badge";
import { apiBaseUrl } from "../../lib/api-client";
import { getStoredUser, hasPermission } from "../../lib/auth";
import type { Quotation } from "../../types/quotations";
import { downloadQuotationExcel, fetchQuotation } from "./quotations-api";
import { formatMoney, toDateInput } from "./quotation-format";

const assetUrl = (path?: string | null) => path ? (path.startsWith("http") ? path : `${apiBaseUrl}${path}`) : "";

export function QuotationDetailClient({ id }: { id: string }) {
  const user = getStoredUser();
  const canManage = hasPermission(user, "quotations.manage");
  const canExport = hasPermission(user, "quotations.export");
  const [quotation, setQuotation] = useState<Quotation>();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchQuotation(id)
      .then((response) => setQuotation(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Cannot load quotation."));
  }, [id]);

  async function exportExcel() {
    if (!quotation) return;
    try {
      await downloadQuotationExcel(quotation.id, quotation.quotationCode);
      setMessage("Quotation exported successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot export quotation.");
    }
  }

  if (!quotation) {
    return <ErrorBanner message={error || "Loading quotation..."} />;
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title={quotation.quotationCode}
        description={`${quotation.customerName} - ${toDateInput(quotation.quotationDate)}`}
        actions={
          <>
            {canManage ? <Link href={`/quotations/${quotation.id}/edit`}><ToolbarButton><Pencil size={16} />Edit</ToolbarButton></Link> : null}
            {canExport ? <ToolbarButton variant="primary" onClick={() => void exportExcel()}><Download size={16} />Export Excel</ToolbarButton> : null}
          </>
        }
      />
      <ErrorBanner message={error} />
      <InfoBanner message={message} />

      <section className="grid gap-4 rounded-md border border-border bg-white p-4 md:grid-cols-4">
        <Info label="Status" value={<StatusBadge value={quotation.status} />} />
        <Info label="Project" value={quotation.project ? `${quotation.project.projectCode} - ${quotation.project.name}` : "-"} />
        <Info label="Customer" value={quotation.customerName} />
        <Info label="Number of Sets" value={quotation.numberOfSets} />
        <Info label="Customer Request" value={quotation.customerRequest ?? "-"} wide />
      </section>

      <DataTable
        items={quotation.items}
        minWidth={900}
        getRowKey={(item) => item.id}
        emptyTitle="No quotation items"
        columns={[
          { key: "index", header: "#", render: (item) => item.lineIndex },
          { key: "code", header: "Material Code", render: (item) => item.materialCodeSnapshot },
          { key: "name", header: "Material Name", render: (item) => item.materialNameSnapshot },
          { key: "quantity", header: "Quantity", className: "text-right", render: (item) => item.quantity },
          { key: "unit", header: "Unit", className: "whitespace-nowrap", render: (item) => item.unitSnapshot },
          { key: "unitPrice", header: "Unit Price", className: "text-right whitespace-nowrap", render: (item) => formatMoney(item.unitPrice) },
          { key: "amount", header: "Amount", className: "text-right whitespace-nowrap", render: (item) => formatMoney(item.amount) }
        ]}
      />

      <section className="grid gap-3 rounded-md border border-border bg-white p-4 md:grid-cols-4">
        <Summary label="Subtotal for 1 Set" value={quotation.subtotalOneSet} />
        <Summary label="Total Before VAT" value={quotation.totalBeforeVat} />
        <Summary label="VAT Amount" value={quotation.vatAmount} />
        <Summary label="Grand Total" value={quotation.grandTotal} strong />
      </section>

      <section className="grid gap-4 rounded-md border border-border bg-white p-4 md:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-ink">Images</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {quotation.images.length === 0 ? <span className="text-sm text-muted">No images uploaded.</span> : null}
            {quotation.images.map((image) => (
              <a key={image.id} href={assetUrl(image.fileUrl)} target="_blank" className="block text-sm font-medium text-primary" rel="noreferrer">{image.fileName}</a>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">Signature</h2>
          {quotation.signatureImageUrl ? <img className="mt-3 h-24 max-w-full rounded-md border border-border object-contain" src={assetUrl(quotation.signatureImageUrl)} alt="Quotation signature" /> : <p className="mt-3 text-sm text-muted">No signature uploaded.</p>}
        </div>
      </section>
    </section>
  );
}

function Info({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-4" : ""}>
      <div className="text-xs font-medium uppercase text-muted">{label}</div>
      <div className="mt-1 text-sm font-medium text-ink">{value}</div>
    </div>
  );
}

function Summary({ label, value, strong }: { label: string; value: string | number; strong?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="text-xs font-medium uppercase text-muted">{label}</div>
      <div className={`mt-1 text-lg ${strong ? "font-bold text-primary" : "font-semibold text-ink"}`}>{formatMoney(value)}</div>
    </div>
  );
}
