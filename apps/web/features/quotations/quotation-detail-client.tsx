"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { CheckCircle, Download, FileUp, Link2, Pencil, RefreshCcw, XCircle } from "lucide-react";
import { ToolbarButton, fieldClassName } from "../../components/ui/controls";
import { DataTable } from "../../components/ui/data-table";
import { ErrorBanner, InfoBanner } from "../../components/ui/feedback";
import { PageHeader } from "../../components/ui/page-header";
import { StatusBadge } from "../../components/ui/status-badge";
import { apiBaseUrl } from "../../lib/api-client";
import { getStoredUser, hasPermission } from "../../lib/auth";
import type { Quotation, QuotationPreview, QuotationVersion } from "../../types/quotations";
import {
  approveQuotationVersion,
  cancelQuotationVersion,
  createQuotationStockOut,
  downloadQuotationExcel,
  fetchQuotation,
  fetchQuotationPreview,
  fetchQuotationVersions,
  rejectQuotationVersion,
  syncQuotationProjectMaterials,
  uploadCustomerPo
} from "./quotations-api";
import { formatMoney, toDateInput } from "./quotation-format";

const assetUrl = (path?: string | null) => path ? (path.startsWith("http") ? path : `${apiBaseUrl}${path}`) : "";

export function QuotationDetailClient({ id }: { id: string }) {
  const user = getStoredUser();
  const canManage = hasPermission(user, "quotations.manage");
  const canExport = hasPermission(user, "quotations.export");
  const canApprove = hasPermission(user, "quotations.approve");
  const canStockOut = hasPermission(user, "quotations.stock_out");
  const canUploadPo = hasPermission(user, "quotations.customer_po.upload");
  const canViewVersions = hasPermission(user, "quotations.version.view");
  const [quotation, setQuotation] = useState<Quotation>();
  const [versions, setVersions] = useState<QuotationVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [preview, setPreview] = useState<QuotationPreview>();
  const [customerPoFile, setCustomerPoFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const response = await fetchQuotation(id);
      setQuotation(response.data);
      const versionResponse = canViewVersions ? await fetchQuotationVersions(id) : { data: response.data.currentVersion ? [response.data.currentVersion] : [] };
      setVersions(versionResponse.data);
      const nextVersionId = selectedVersionId || response.data.currentVersionId || versionResponse.data[0]?.id || "";
      setSelectedVersionId(nextVersionId);
      if (nextVersionId) {
        const previewResponse = await fetchQuotationPreview(id, nextVersionId);
        setPreview(previewResponse.data);
      }
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load quotation.");
    }
  }

  useEffect(() => {
    void load();
  }, [id, canViewVersions]);

  useEffect(() => {
    if (!selectedVersionId) return;
    fetchQuotationPreview(id, selectedVersionId)
      .then((response) => setPreview(response.data))
      .catch(() => setPreview(undefined));
  }, [id, selectedVersionId]);

  const activeVersion = useMemo(
    () => versions.find((version) => version.id === selectedVersionId) ?? quotation?.currentVersion ?? versions[0],
    [quotation?.currentVersion, selectedVersionId, versions]
  );

  async function exportExcel() {
    if (!quotation) return;
    try {
      await downloadQuotationExcel(quotation.id, quotation.quotationCode, activeVersion?.id);
      setMessage("Quotation exported successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot export quotation.");
    }
  }

  async function runVersionAction(action: "approve" | "reject" | "cancel" | "stock-out" | "sync") {
    if (!quotation || !activeVersion) return;
    setError("");
    setMessage("");
    try {
      if (action === "approve") {
        await approveQuotationVersion(quotation.id, activeVersion.id);
        setMessage("Quotation version approved successfully.");
      } else if (action === "reject") {
        await rejectQuotationVersion(quotation.id, activeVersion.id);
        setMessage("Quotation version rejected successfully.");
      } else if (action === "cancel") {
        await cancelQuotationVersion(quotation.id, activeVersion.id);
        setMessage("Quotation version cancelled successfully.");
      } else if (action === "stock-out") {
        await createQuotationStockOut(quotation.id, activeVersion.id);
        setMessage("Stock out created successfully.");
      } else {
        await syncQuotationProjectMaterials(quotation.id, activeVersion.id);
        setMessage("Quotation items synced to project materials.");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    }
  }

  async function uploadPo() {
    if (!quotation || !activeVersion || !customerPoFile) return;
    setError("");
    setMessage("");
    try {
      await uploadCustomerPo(quotation.id, activeVersion.id, customerPoFile);
      setCustomerPoFile(null);
      setMessage("Customer PO uploaded successfully.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot upload customer PO.");
    }
  }

  if (!quotation) {
    return <ErrorBanner message={error || "Loading quotation..."} />;
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title={quotation.quotationCode}
        description={`${quotation.quotationType === "project" ? "Project" : "Commercial"} quotation - ${quotation.customerName} - ${toDateInput(quotation.quotationDate)}`}
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
        <Info label="Type" value={quotation.quotationType === "project" ? "Project Quotation" : "Commercial Quotation"} />
        <Info label="Project" value={quotation.project ? `${quotation.project.projectCode} - ${quotation.project.name}` : "-"} />
        <Info label="Customer" value={quotation.customerName} />
        <Info label="Number of Sets" value={quotation.numberOfSets} />
        <Info label="Customer Request" value={quotation.customerRequest ?? "-"} wide />
        <Info label="Content" value={quotation.content ?? "-"} wide />
      </section>

      <section className="space-y-3 rounded-md border border-border bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <label className="text-sm font-medium">
            Version
            <select className={`mt-1 min-w-64 ${fieldClassName()}`} value={selectedVersionId} onChange={(event) => setSelectedVersionId(event.target.value)}>
              {versions.map((version) => (
                <option key={version.id} value={version.id}>v{version.versionNumber} - {version.status}</option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            {canApprove && activeVersion ? <ToolbarButton onClick={() => void runVersionAction("approve")}><CheckCircle size={16} />Approve</ToolbarButton> : null}
            {canApprove && activeVersion ? <ToolbarButton onClick={() => void runVersionAction("reject")}><XCircle size={16} />Reject</ToolbarButton> : null}
            {canApprove && activeVersion ? <ToolbarButton onClick={() => void runVersionAction("cancel")}><XCircle size={16} />Cancel</ToolbarButton> : null}
            {canStockOut && activeVersion?.status === "approved" ? <ToolbarButton variant="primary" onClick={() => void runVersionAction("stock-out")}><RefreshCcw size={16} />Create Stock Out</ToolbarButton> : null}
            {canManage && quotation.quotationType === "project" && activeVersion ? <ToolbarButton onClick={() => void runVersionAction("sync")}><Link2 size={16} />Sync Items to Project Materials</ToolbarButton> : null}
          </div>
        </div>
        {canUploadPo && activeVersion ? (
          <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3 md:flex-row md:items-center">
            <input className={fieldClassName("bg-white")} type="file" onChange={(event: ChangeEvent<HTMLInputElement>) => setCustomerPoFile(event.target.files?.[0] ?? null)} />
            <ToolbarButton disabled={!customerPoFile} onClick={() => void uploadPo()}><FileUp size={16} />Upload Customer PO</ToolbarButton>
            {activeVersion.customerPoFileName ? <span className="text-sm text-muted">Current PO: {activeVersion.customerPoFileName}</span> : null}
          </div>
        ) : null}
      </section>

      <DataTable
        items={activeVersion?.items ?? quotation.items}
        minWidth={900}
        getRowKey={(item) => item.id}
        emptyTitle="No quotation items"
        columns={[
          { key: "index", header: "#", render: (item) => item.lineIndex },
          { key: "code", header: "Material Code", render: (item) => item.materialCodeSnapshot },
          { key: "name", header: "Material Name", render: (item) => item.materialNameSnapshot },
          { key: "model", header: "Model", render: (item) => item.modelSnapshot || "-" },
          { key: "quantity", header: "Quantity", className: "text-right", render: (item) => item.quantity },
          { key: "unit", header: "Unit", className: "whitespace-nowrap", render: (item) => item.unitSnapshot },
          { key: "unitPrice", header: "Unit Price", className: "text-right whitespace-nowrap", render: (item) => formatMoney(item.unitPrice) },
          { key: "amount", header: "Amount", className: "text-right whitespace-nowrap", render: (item) => formatMoney(item.amount) }
        ]}
      />

      <section className="grid gap-3 rounded-md border border-border bg-white p-4 md:grid-cols-4">
        <Summary label="Subtotal for 1 Set" value={activeVersion?.subtotalOneSet ?? quotation.subtotalOneSet} />
        <Summary label="Total Before VAT" value={activeVersion?.totalBeforeVat ?? quotation.totalBeforeVat} />
        <Summary label="VAT Amount" value={activeVersion?.vatAmount ?? quotation.vatAmount} />
        <Summary label="Grand Total" value={activeVersion?.grandTotal ?? quotation.grandTotal} strong />
      </section>

      {preview ? (
        <section className="space-y-4 rounded-md border border-border bg-white p-5">
          <div className="border-b border-border pb-3">
            <div className="text-lg font-bold text-ink">{preview.companySettings?.companyName || "Company Quotation"}</div>
            <div className="text-sm text-muted">{preview.companySettings?.address || "Company address"}</div>
            <div className="text-sm text-muted">{preview.companySettings?.phone || "-"} {preview.companySettings?.email ? `- ${preview.companySettings.email}` : ""}</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold uppercase text-ink">Quotation Preview</div>
            <div className="mt-1 text-sm text-muted">Version {preview.version.versionNumber}</div>
          </div>
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <Info label="Quotation Code" value={preview.quotation.quotationCode} />
            <Info label="Project" value={preview.projectName} />
            <Info label="Customer" value={preview.version.customerName} />
            <Info label="Date" value={toDateInput(preview.version.quotationDate)} />
            <Info label="Specifications" value={preview.version.customerRequest || "-"} wide />
            <Info label="Content" value={preview.version.content || "-"} wide />
          </div>
        </section>
      ) : null}

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
