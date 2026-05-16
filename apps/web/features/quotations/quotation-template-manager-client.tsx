"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { CheckCircle, Trash2, Upload } from "lucide-react";
import { ToolbarButton, fieldClassName } from "../../components/ui/controls";
import { DataTable } from "../../components/ui/data-table";
import { ErrorBanner, InfoBanner } from "../../components/ui/feedback";
import { PageHeader } from "../../components/ui/page-header";
import { getStoredUser, hasPermission } from "../../lib/auth";
import type { QuotationTemplate } from "../../types/quotations";
import {
  deleteQuotationTemplate,
  fetchQuotationTemplates,
  setDefaultQuotationTemplate,
  updateQuotationTemplateMapping,
  uploadQuotationTemplate
} from "./quotations-api";
import { QuotationCanvasEditor } from "./quotation-canvas-editor";

const defaultMapping = {
  "#yyyyMMdd": "quotationDate",
  "Q-#yyyyMMdd+ID": "quotationCode",
  "#Project": "projectName",
  "#Customer": "customerName",
  "#Spect": "customerRequest",
  "#Content": "content",
  "#Name": "materialName",
  "#Model": "model",
  "#Qty": "quantity",
  "#Unit": "unit",
  "#Price": "unitPrice",
  "#PriceTotal": "amount"
};

export function QuotationTemplateManagerClient() {
  const user = getStoredUser();
  const canManage = hasPermission(user, "quotation_templates.manage");
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [mappingText, setMappingText] = useState(JSON.stringify(defaultMapping, null, 2));
  const [activeTemplateId, setActiveTemplateId] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<QuotationTemplate | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const response = await fetchQuotationTemplates({ pageSize: 50 });
      setTemplates(response.data.items);
      setSelectedTemplate((current) => {
        if (!current) return response.data.items.find((item) => item.id === activeTemplateId) ?? null;
        return response.data.items.find((item) => item.id === current.id) ?? current;
      });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load quotation templates.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function upload() {
    if (!file) {
      setError("Select an Excel template file first.");
      return;
    }
    try {
      const response = await uploadQuotationTemplate(file, name.trim() || undefined);
      setMessage("Template uploaded successfully.");
      setFile(null);
      setName("");
      setActiveTemplateId(response.data.id);
      setSelectedTemplate(response.data);
      setMappingText(JSON.stringify(response.data.placeholderConfig || defaultMapping, null, 2));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot upload template.");
    }
  }

  async function saveMapping() {
    if (!activeTemplateId) {
      setError("Select a template before saving mapping.");
      return;
    }
    try {
      const parsed = JSON.parse(mappingText) as Record<string, string>;
      await updateQuotationTemplateMapping(activeTemplateId, parsed);
      setMessage("Placeholder mapping saved successfully.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save placeholder mapping.");
    }
  }

  async function makeDefault(id: string) {
    try {
      await setDefaultQuotationTemplate(id);
      setMessage("Default template updated successfully.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot update default template.");
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this quotation template?")) return;
    try {
      await deleteQuotationTemplate(id);
      setMessage("Template deleted successfully.");
      if (activeTemplateId === id) {
        setActiveTemplateId("");
        setSelectedTemplate(null);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot delete template.");
    }
  }

  function selectTemplate(template: QuotationTemplate) {
    setActiveTemplateId(template.id);
    setSelectedTemplate(template);
    setMappingText(JSON.stringify(template.placeholderConfig || defaultMapping, null, 2));
  }

  if (!canManage) {
    return <div className="rounded-md border border-border bg-white p-5 text-sm text-muted">You do not have permission to manage quotation templates.</div>;
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Quotation Templates" description="Upload Excel templates and map quotation placeholders for export." />
      <ErrorBanner message={error} />
      <InfoBanner message={message} />

      <section className="grid gap-4 rounded-md border border-border bg-white p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="text-sm font-medium">
          Template Name
          <input className={`mt-1 w-full ${fieldClassName()}`} value={name} onChange={(event) => setName(event.target.value)} placeholder="Template name" />
        </label>
        <label className="text-sm font-medium">
          Excel File
          <input className={`mt-1 w-full ${fieldClassName("py-2")}`} type="file" accept=".xlsx" onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)} />
        </label>
        <ToolbarButton variant="primary" onClick={() => void upload()}><Upload size={16} />Upload Template</ToolbarButton>
      </section>

      <DataTable
        items={templates}
        minWidth={760}
        getRowKey={(item) => item.id}
        emptyTitle="No quotation templates"
        emptyDescription="Upload an Excel template to customize quotation exports."
        columns={[
          { key: "name", header: "Name", render: (item) => <button className="font-semibold text-primary" type="button" onClick={() => selectTemplate(item)}>{item.name}</button> },
          { key: "file", header: "Original File", render: (item) => item.originalFileName ?? item.fileName ?? "-" },
          { key: "default", header: "Default", className: "whitespace-nowrap", render: (item) => item.isDefault ? "Yes" : "No" },
          {
            key: "actions",
            header: "Actions",
            className: "whitespace-nowrap",
            render: (item) => (
              <div className="flex flex-nowrap gap-2">
                <ToolbarButton className="h-8 px-2 text-xs" onClick={() => void makeDefault(item.id)}><CheckCircle size={14} />Default</ToolbarButton>
                <ToolbarButton variant="danger" className="h-8 px-2 text-xs" onClick={() => void remove(item.id)}><Trash2 size={14} />Delete</ToolbarButton>
              </div>
            )
          }
        ]}
      />

      <section className="rounded-md border border-border bg-white p-4">
        <label className="text-sm font-medium">
          Placeholder Mapping JSON
          <textarea className="mt-1 min-h-72 w-full rounded-md border border-border bg-white px-3 py-2 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" value={mappingText} onChange={(event) => setMappingText(event.target.value)} />
        </label>
        <div className="mt-3 flex justify-end">
          <ToolbarButton variant="primary" onClick={() => void saveMapping()}>Save Mapping</ToolbarButton>
        </div>
      </section>

      {selectedTemplate ? (
        <QuotationCanvasEditor key={selectedTemplate.id} template={selectedTemplate} />
      ) : (
        <section className="rounded-md border border-border bg-white p-4 text-sm text-muted">
          Select a template to edit its canvas layout.
        </section>
      )}
    </section>
  );
}
