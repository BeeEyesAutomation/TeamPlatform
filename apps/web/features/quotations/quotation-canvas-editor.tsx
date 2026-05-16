"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Copy, Eye, EyeOff, Lock, Plus, Save, Unlock } from "lucide-react";
import { ToolbarButton, fieldClassName } from "../../components/ui/controls";
import { ErrorBanner, InfoBanner } from "../../components/ui/feedback";
import type {
  QuotationCanvasConfig,
  QuotationLayoutBlock,
  QuotationLayoutBlockType,
  QuotationLayoutConfig,
  QuotationTableColumnConfig,
  QuotationTableConfig,
  QuotationTemplate,
  QuotationTemplateVersion
} from "../../types/quotations";
import {
  createQuotationTemplateVersion,
  duplicateQuotationTemplateVersion,
  fetchQuotationTemplateVersions,
  setDefaultQuotationTemplateVersion,
  updateQuotationTemplateVersionLayout,
  updateQuotationTemplateVersionTableConfig
} from "./quotations-api";

const blockTypes: QuotationLayoutBlockType[] = [
  "text",
  "company_info",
  "quotation_info",
  "project_info",
  "customer_info",
  "content",
  "specifications",
  "material_table",
  "image",
  "logo",
  "signature",
  "notes",
  "totals",
  "vat_summary",
  "divider",
  "custom_field"
];

const placeholders = [
  "{{company.name}}",
  "{{company.taxCode}}",
  "{{company.address}}",
  "{{company.phone}}",
  "{{company.email}}",
  "{{company.bankAccount}}",
  "{{quotation.code}}",
  "{{quotation.date}}",
  "{{quotation.type}}",
  "{{project.name}}",
  "{{customer.name}}",
  "{{customer.request}}",
  "{{quotation.content}}",
  "{{subtotalOneSet}}",
  "{{numberOfSets}}",
  "{{totalBeforeVat}}",
  "{{vatAmount}}",
  "{{grandTotal}}",
  "{{notes}}",
  "{{signature.image}}",
  "{{signature.title}}"
];

const defaultCanvas: QuotationCanvasConfig = { pageWidth: 794, pageHeight: 1123, unit: "px", backgroundColor: "#ffffff" };
const defaultTable: QuotationTableConfig = {
  columns: [
    { key: "lineIndex", label: "No", width: 48, visible: true, align: "center" },
    { key: "materialCodeSnapshot", label: "Material Code", width: 120, visible: true, align: "left" },
    { key: "materialNameSnapshot", label: "Item Description", width: 220, visible: true, align: "left" },
    { key: "modelSnapshot", label: "Model", width: 120, visible: true, align: "left" },
    { key: "pictureUrlSnapshot", label: "Picture", width: 90, visible: true, align: "center" },
    { key: "quantity", label: "Quantity", width: 90, visible: true, align: "right" },
    { key: "unitSnapshot", label: "Unit", width: 70, visible: true, align: "center" },
    { key: "unitPrice", label: "Unit Price", width: 120, visible: true, align: "right" },
    { key: "amount", label: "Amount", width: 120, visible: true, align: "right" }
  ]
};
const customColumnOptions = ["brand", "origin", "leadTime", "warranty", "remark"];

function emptyLayout(): QuotationLayoutConfig {
  return { blocks: [] };
}

function createBlock(blockType: QuotationLayoutBlockType, index: number): QuotationLayoutBlock {
  return {
    id: `${blockType}-${Date.now()}-${index}`,
    blockType,
    x: 48 + index * 12,
    y: 48 + index * 12,
    width: blockType === "material_table" ? 680 : 260,
    height: blockType === "material_table" ? 300 : 90,
    zIndex: index + 1,
    visible: true,
    locked: false,
    content: blockType.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    bindingKey: "",
    styleConfig: { fontSize: 13, fontWeight: "500", textAlign: "left", textColor: "#111827", backgroundColor: "#ffffff", border: true, padding: 8 },
    required: ["company_info", "quotation_info", "material_table", "totals"].includes(blockType)
  };
}

function sampleValue(bindingKey?: string, content?: string) {
  const values: Record<string, string> = {
    "company.name": "TeamPlatform Company",
    "company.taxCode": "Tax Code: 0123456789",
    "company.address": "Company Address",
    "company.phone": "Phone: 0900 000 000",
    "company.email": "Email: sales@example.com",
    "quotation.code": "Q-20260516-001",
    "quotation.date": "2026-05-16",
    "quotation.type": "Project Quotation",
    "project.name": "Project Alpha",
    "customer.name": "Customer Name",
    "customer.request": "Customer specifications and request",
    "quotation.content": "Quotation content",
    subtotalOneSet: "100,000",
    numberOfSets: "2",
    totalBeforeVat: "200,000",
    vatAmount: "20,000",
    grandTotal: "220,000",
    notes: "Quotation notes",
    "signature.title": "Authorized Signature"
  };
  return bindingKey ? values[bindingKey] ?? bindingKey : content ?? "";
}

export function QuotationCanvasEditor({ template }: { template: QuotationTemplate }) {
  const [versions, setVersions] = useState<QuotationTemplateVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState("");
  const [layoutConfig, setLayoutConfig] = useState<QuotationLayoutConfig>(emptyLayout());
  const [tableConfig, setTableConfig] = useState<QuotationTableConfig>(defaultTable);
  const [canvasConfig, setCanvasConfig] = useState<QuotationCanvasConfig>(defaultCanvas);
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedBlock = useMemo(() => layoutConfig.blocks.find((block) => block.id === selectedBlockId), [layoutConfig.blocks, selectedBlockId]);

  async function loadVersions(preferredId?: string) {
    try {
      const response = await fetchQuotationTemplateVersions(template.id);
      setVersions(response.data);
      const selected = response.data.find((version) => version.id === preferredId) ?? response.data.find((version) => version.id === template.defaultVersionId) ?? response.data[0];
      if (selected) applyVersion(selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load template versions.");
    }
  }

  function applyVersion(version: QuotationTemplateVersion) {
    setActiveVersionId(version.id);
    setLayoutConfig(version.layoutConfig ?? emptyLayout());
    setTableConfig(version.tableConfig ?? defaultTable);
    setCanvasConfig(version.canvasConfig ?? defaultCanvas);
    setSelectedBlockId(version.layoutConfig?.blocks?.[0]?.id ?? "");
  }

  useEffect(() => {
    void loadVersions();
  }, [template.id]);

  async function createVersionIfMissing() {
    if (activeVersionId) return activeVersionId;
    const response = await createQuotationTemplateVersion(template.id);
    await loadVersions(response.data.id);
    return response.data.id;
  }

  function updateBlock(id: string, patch: Partial<QuotationLayoutBlock>) {
    setLayoutConfig((current) => ({ ...current, blocks: current.blocks.map((block) => block.id === id ? { ...block, ...patch } : block) }));
  }

  function updateBlockStyle(id: string, patch: Record<string, string | number | boolean>) {
    setLayoutConfig((current) => ({
      ...current,
      blocks: current.blocks.map((block) => block.id === id ? { ...block, styleConfig: { ...block.styleConfig, ...patch } } : block)
    }));
  }

  function addBlock(blockType: QuotationLayoutBlockType) {
    const block = createBlock(blockType, layoutConfig.blocks.length);
    setLayoutConfig((current) => ({ ...current, blocks: [...current.blocks, block] }));
    setSelectedBlockId(block.id);
  }

  function duplicateBlock() {
    if (!selectedBlock) return;
    const copy = { ...selectedBlock, id: `${selectedBlock.id}-copy-${Date.now()}`, x: selectedBlock.x + 24, y: selectedBlock.y + 24, locked: false, zIndex: selectedBlock.zIndex + 1 };
    setLayoutConfig((current) => ({ ...current, blocks: [...current.blocks, copy] }));
    setSelectedBlockId(copy.id);
  }

  function deleteBlock() {
    if (!selectedBlock || selectedBlock.required) return;
    setLayoutConfig((current) => ({ ...current, blocks: current.blocks.filter((block) => block.id !== selectedBlock.id) }));
    setSelectedBlockId("");
  }

  function updateColumn(index: number, patch: Partial<QuotationTableColumnConfig>) {
    setTableConfig((current) => ({ ...current, columns: current.columns.map((column, columnIndex) => columnIndex === index ? { ...column, ...patch } : column) }));
  }

  function moveColumn(index: number, direction: -1 | 1) {
    setTableConfig((current) => {
      const next = [...current.columns];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return current;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return { ...current, columns: next };
    });
  }

  function addCustomColumn(key: string) {
    if (tableConfig.columns.some((column) => column.key === key)) return;
    setTableConfig((current) => ({
      ...current,
      columns: [...current.columns, { key, label: key.replace(/[A-Z]/g, (char) => ` ${char}`).replace(/^\w/, (char) => char.toUpperCase()), width: 120, visible: true, align: "left", custom: true }]
    }));
  }

  async function saveLayout() {
    setError("");
    setMessage("");
    try {
      const versionId = await createVersionIfMissing();
      await updateQuotationTemplateVersionLayout(versionId, { layoutConfig, canvasConfig });
      await updateQuotationTemplateVersionTableConfig(versionId, tableConfig);
      setMessage("Layout saved successfully.");
      await loadVersions(versionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save layout.");
    }
  }

  async function duplicateVersion() {
    if (!activeVersionId) return;
    const response = await duplicateQuotationTemplateVersion(activeVersionId);
    setMessage("Template version duplicated successfully.");
    await loadVersions(response.data.id);
  }

  async function makeDefaultVersion() {
    if (!activeVersionId) return;
    await setDefaultQuotationTemplateVersion(template.id, activeVersionId);
    setMessage("Default template version updated successfully.");
    await loadVersions(activeVersionId);
  }

  return (
    <section className="space-y-4 rounded-md border border-border bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium">
            Template Version
            <select className={`mt-1 min-w-56 ${fieldClassName()}`} value={activeVersionId} onChange={(event) => {
              const version = versions.find((item) => item.id === event.target.value);
              if (version) applyVersion(version);
            }}>
              {versions.map((version) => <option key={version.id} value={version.id}>Version {version.versionNumber}</option>)}
            </select>
          </label>
          <ToolbarButton onClick={() => setMode((current) => current === "edit" ? "preview" : "edit")}>{mode === "edit" ? <Eye size={16} /> : <EyeOff size={16} />}{mode === "edit" ? "Preview Data" : "Edit Layout"}</ToolbarButton>
        </div>
        <div className="flex flex-wrap gap-2">
          <ToolbarButton onClick={() => void duplicateVersion()} disabled={!activeVersionId}><Copy size={16} />Duplicate Template Version</ToolbarButton>
          <ToolbarButton onClick={() => void makeDefaultVersion()} disabled={!activeVersionId}>Set as Default</ToolbarButton>
          <ToolbarButton variant="primary" onClick={() => void saveLayout()}><Save size={16} />Save Layout</ToolbarButton>
        </div>
      </div>
      <ErrorBanner message={error} />
      <InfoBanner message={message} />

      <div className="grid gap-4 xl:grid-cols-[180px_minmax(0,1fr)_320px]">
        <aside className="space-y-2 rounded-md border border-border bg-surface p-3">
          <div className="text-xs font-semibold uppercase text-muted">Add Blocks</div>
          {blockTypes.map((blockType) => (
            <button key={blockType} className="flex w-full items-center gap-2 rounded-md border border-border bg-white px-2 py-1.5 text-left text-xs font-medium hover:bg-gray-50" type="button" onClick={() => addBlock(blockType)}>
              <Plus size={13} />{blockType.replaceAll("_", " ")}
            </button>
          ))}
        </aside>

        <div className="overflow-auto rounded-md border border-border bg-gray-100 p-4">
          <div
            className="relative mx-auto shadow-sm"
            style={{ width: canvasConfig.pageWidth, height: canvasConfig.pageHeight, backgroundColor: canvasConfig.backgroundColor ?? "#ffffff" }}
          >
            {layoutConfig.blocks.filter((block) => block.visible).sort((a, b) => a.zIndex - b.zIndex).map((block) => (
              <button
                key={block.id}
                className={`absolute overflow-hidden border text-left ${selectedBlockId === block.id ? "ring-2 ring-blue-500" : ""}`}
                style={{
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
                }}
                type="button"
                onClick={() => setSelectedBlockId(block.id)}
              >
                {block.blockType === "material_table" ? <MaterialTablePreview tableConfig={tableConfig} /> : mode === "preview" ? sampleValue(block.bindingKey, block.content) : block.content}
              </button>
            ))}
          </div>
        </div>

        <aside className="space-y-4 rounded-md border border-border bg-surface p-3">
          <div>
            <div className="text-xs font-semibold uppercase text-muted">Properties</div>
            {!selectedBlock ? <p className="mt-2 text-sm text-muted">Select a block to edit its properties.</p> : (
              <div className="mt-3 space-y-3">
                <Field label="Content"><input className={fieldClassName()} value={selectedBlock.content ?? ""} onChange={(event) => updateBlock(selectedBlock.id, { content: event.target.value })} /></Field>
                <Field label="Placeholder"><select className={fieldClassName()} value={selectedBlock.bindingKey ?? ""} onChange={(event) => updateBlock(selectedBlock.id, { bindingKey: event.target.value.replace(/[{}]/g, "") })}><option value="">No binding</option>{placeholders.map((placeholder) => <option key={placeholder} value={placeholder.replace(/[{}]/g, "")}>{placeholder}</option>)}</select></Field>
                <div className="grid grid-cols-2 gap-2">
                  <NumberField label="X" value={selectedBlock.x} onChange={(value) => updateBlock(selectedBlock.id, { x: value })} />
                  <NumberField label="Y" value={selectedBlock.y} onChange={(value) => updateBlock(selectedBlock.id, { y: value })} />
                  <NumberField label="Width" value={selectedBlock.width} onChange={(value) => updateBlock(selectedBlock.id, { width: value })} />
                  <NumberField label="Height" value={selectedBlock.height} onChange={(value) => updateBlock(selectedBlock.id, { height: value })} />
                  <NumberField label="Layer" value={selectedBlock.zIndex} onChange={(value) => updateBlock(selectedBlock.id, { zIndex: value })} />
                  <NumberField label="Font" value={Number(selectedBlock.styleConfig?.fontSize ?? 13)} onChange={(value) => updateBlockStyle(selectedBlock.id, { fontSize: value })} />
                </div>
                <Field label="Text Align"><select className={fieldClassName()} value={selectedBlock.styleConfig?.textAlign ?? "left"} onChange={(event) => updateBlockStyle(selectedBlock.id, { textAlign: event.target.value })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Text Color"><input className={fieldClassName()} type="color" value={selectedBlock.styleConfig?.textColor ?? "#111827"} onChange={(event) => updateBlockStyle(selectedBlock.id, { textColor: event.target.value })} /></Field>
                  <Field label="Background"><input className={fieldClassName()} type="color" value={selectedBlock.styleConfig?.backgroundColor ?? "#ffffff"} onChange={(event) => updateBlockStyle(selectedBlock.id, { backgroundColor: event.target.value })} /></Field>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ToolbarButton className="h-8 px-2 text-xs" onClick={() => updateBlock(selectedBlock.id, { locked: !selectedBlock.locked })}>{selectedBlock.locked ? <Unlock size={14} /> : <Lock size={14} />}{selectedBlock.locked ? "Unlock" : "Lock"}</ToolbarButton>
                  <ToolbarButton className="h-8 px-2 text-xs" onClick={() => updateBlock(selectedBlock.id, { visible: !selectedBlock.visible })}>{selectedBlock.visible ? "Hide" : "Show"}</ToolbarButton>
                  <ToolbarButton className="h-8 px-2 text-xs" onClick={() => updateBlock(selectedBlock.id, { x: 40 })}>Align Left</ToolbarButton>
                  <ToolbarButton className="h-8 px-2 text-xs" onClick={() => updateBlock(selectedBlock.id, { x: Math.round((canvasConfig.pageWidth - selectedBlock.width) / 2) })}>Center</ToolbarButton>
                  <ToolbarButton className="h-8 px-2 text-xs" onClick={() => updateBlock(selectedBlock.id, { x: canvasConfig.pageWidth - selectedBlock.width - 40 })}>Align Right</ToolbarButton>
                  <ToolbarButton className="h-8 px-2 text-xs" onClick={duplicateBlock}>Duplicate Block</ToolbarButton>
                  <ToolbarButton variant="danger" className="h-8 px-2 text-xs" onClick={deleteBlock} disabled={selectedBlock.required}>Delete</ToolbarButton>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <div className="text-xs font-semibold uppercase text-muted">Material Table Columns</div>
            <div className="mt-2 space-y-2">
              {tableConfig.columns.map((column, index) => (
                <div key={column.key} className="rounded-md border border-border bg-white p-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={column.visible} onChange={(event) => updateColumn(index, { visible: event.target.checked })} />
                    <input className={fieldClassName("h-8 flex-1")} value={column.label} onChange={(event) => updateColumn(index, { label: event.target.value })} />
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <input className={fieldClassName("h-8")} value={column.width} onChange={(event) => updateColumn(index, { width: Number(event.target.value) || 80 })} />
                    <select className={fieldClassName("h-8")} value={column.align} onChange={(event) => updateColumn(index, { align: event.target.value as QuotationTableColumnConfig["align"] })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select>
                    <div className="flex gap-1">
                      <button className="rounded border px-2 text-xs" type="button" onClick={() => moveColumn(index, -1)}>Up</button>
                      <button className="rounded border px-2 text-xs" type="button" onClick={() => moveColumn(index, 1)}>Down</button>
                    </div>
                  </div>
                </div>
              ))}
              <select className={`w-full ${fieldClassName()}`} value="" onChange={(event) => event.target.value ? addCustomColumn(event.target.value) : undefined}>
                <option value="">Add custom column</option>
                {customColumnOptions.map((key) => <option key={key} value={key}>{key}</option>)}
              </select>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-xs font-medium text-muted">{label}<div className="mt-1">{children}</div></label>;
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <Field label={label}><input className={fieldClassName()} type="number" step={1} value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} /></Field>;
}

function MaterialTablePreview({ tableConfig }: { tableConfig: QuotationTableConfig }) {
  const columns = tableConfig.columns.filter((column) => column.visible);
  return (
    <table className="w-full border-collapse text-[10px]">
      <thead><tr>{columns.map((column) => <th key={column.key} className="border border-gray-300 bg-gray-100 px-1 py-1" style={{ textAlign: column.align }}>{column.label}</th>)}</tr></thead>
      <tbody>
        {[1, 2, 3].map((row) => <tr key={row}>{columns.map((column) => <td key={column.key} className="border border-gray-200 px-1 py-1" style={{ textAlign: column.align }}>{column.key === "lineIndex" ? row : column.key === "quantity" ? "1" : column.key === "amount" ? "100,000" : "Sample"}</td>)}</tr>)}
      </tbody>
    </table>
  );
}
