"use client";

import type { CSSProperties } from "react";
import type { QuotationLayoutBlock, QuotationPreview, QuotationTableColumnConfig, QuotationTableConfig } from "../../types/quotations";
import { formatMoney, toDateInput } from "./quotation-format";

function textValue(bindingKey: string | undefined, fallback: string | undefined, preview: QuotationPreview) {
  const values: Record<string, string> = {
    "company.name": preview.companySettings?.companyName ?? "Company Quotation",
    "company.taxCode": preview.companySettings?.taxCode ? `Tax Code: ${preview.companySettings.taxCode}` : "",
    "company.address": preview.companySettings?.address ?? "",
    "company.phone": preview.companySettings?.phone ?? "",
    "company.email": preview.companySettings?.email ?? "",
    "company.bankAccount": preview.companySettings?.bankAccountNumber ?? "",
    "quotation.code": preview.quotation.quotationCode,
    "quotation.date": toDateInput(preview.version.quotationDate),
    "quotation.type": preview.quotation.quotationType === "project" ? "Project Quotation" : "Commercial Quotation",
    "project.name": preview.projectName,
    "customer.name": preview.version.customerName,
    "customer.request": preview.version.customerRequest ?? "",
    "quotation.content": preview.version.content ?? "",
    subtotalOneSet: formatMoney(preview.version.subtotalOneSet),
    numberOfSets: String(preview.version.numberOfSets),
    totalBeforeVat: formatMoney(preview.version.totalBeforeVat),
    vatAmount: formatMoney(preview.version.vatAmount),
    grandTotal: formatMoney(preview.version.grandTotal),
    notes: "",
    "signature.title": "Authorized Signature"
  };
  return bindingKey ? values[bindingKey] ?? fallback ?? "" : fallback ?? "";
}

function cellValue(column: QuotationTableColumnConfig, item: QuotationPreview["version"]["items"][number]) {
  const values: Record<string, string | number | null | undefined> = {
    lineIndex: item.lineIndex,
    materialCodeSnapshot: item.materialCodeSnapshot,
    materialNameSnapshot: item.materialNameSnapshot,
    modelSnapshot: item.modelSnapshot,
    pictureUrlSnapshot: item.pictureUrlSnapshot,
    quantity: item.quantity,
    unitSnapshot: item.unitSnapshot,
    unitPrice: formatMoney(item.unitPrice),
    amount: formatMoney(item.amount),
    brand: "",
    origin: "",
    leadTime: "",
    warranty: "",
    remark: ""
  };
  return values[column.key] ?? "";
}

function styleForBlock(block: QuotationLayoutBlock): CSSProperties {
  return {
    left: block.x,
    top: block.y,
    width: block.width,
    height: block.height,
    zIndex: block.zIndex,
    padding: block.styleConfig?.padding ?? 8,
    fontSize: block.styleConfig?.fontSize ?? 13,
    fontWeight: block.styleConfig?.fontWeight ?? "400",
    fontStyle: block.styleConfig?.italic ? "italic" : "normal",
    color: block.styleConfig?.textColor ?? "#111827",
    backgroundColor: block.styleConfig?.backgroundColor ?? "#ffffff",
    textAlign: block.styleConfig?.textAlign ?? "left",
    borderColor: block.styleConfig?.border === false ? "transparent" : "#d1d5db"
  };
}

export function QuotationLayoutPreview({ preview }: { preview: QuotationPreview }) {
  if (!preview.layoutConfig?.blocks?.length) return null;
  const canvas = preview.canvasConfig ?? { pageWidth: 794, pageHeight: 1123, backgroundColor: "#ffffff" };
  const tableConfig = preview.tableConfig ?? { columns: [] };

  return (
    <section className="rounded-md border border-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Layout Preview</h2>
        <span className="text-xs text-muted">Template Version {preview.templateVersion?.versionNumber ?? "-"}</span>
      </div>
      <div className="overflow-auto rounded-md border border-border bg-gray-100 p-4">
        <div
          className="relative mx-auto shadow-sm"
          style={{ width: canvas.pageWidth, height: canvas.pageHeight, backgroundColor: canvas.backgroundColor ?? "#ffffff" }}
        >
          {preview.layoutConfig.blocks.filter((block) => block.visible).sort((a, b) => a.zIndex - b.zIndex).map((block) => (
            <div key={block.id} className="absolute overflow-hidden border" style={styleForBlock(block)}>
              {block.blockType === "material_table" ? <MaterialTable tableConfig={tableConfig} preview={preview} /> : textValue(block.bindingKey, block.content, preview)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MaterialTable({ tableConfig, preview }: { tableConfig: QuotationTableConfig; preview: QuotationPreview }) {
  const columns = tableConfig.columns?.filter((column) => column.visible) ?? [];
  if (columns.length === 0) return <div className="text-sm text-muted">No table columns configured.</div>;
  return (
    <table className="w-full border-collapse text-[11px]">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key} className="border border-gray-300 bg-gray-100 px-1.5 py-1" style={{ width: column.width, textAlign: column.align }}>
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {preview.version.items.map((item) => (
          <tr key={item.id}>
            {columns.map((column) => (
              <td key={column.key} className="border border-gray-200 px-1.5 py-1" style={{ textAlign: column.align }}>
                {cellValue(column, item)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
