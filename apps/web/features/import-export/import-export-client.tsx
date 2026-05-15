"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getStoredAccessToken } from "../../lib/api-client";
import type { ExportLog, ImportLog, ImportPreviewRow } from "../../types/import-export";
import { exportUrl, fetchExportLogs, fetchImportLogs, importTemplateUrl, previewImport, uploadImportFile } from "./import-export-api";

const importTypes = ["employees", "projects", "project-plans", "project-tasks", "project-issues", "project-materials", "project-costs", "inventory-categories", "inventory-suppliers", "inventory-items", "inventory-stock-adjustments", "allowances"];
const exportTypes = ["employees", "attendance", "payroll", "projects", "project-progress", "project-costs", "project-issues", "project-materials", "inventory-items", "inventory-movements"];

export function ImportExportClient() {
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [exportLogs, setExportLogs] = useState<ExportLog[]>([]);
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [importsResponse, exportsResponse] = await Promise.all([fetchImportLogs(), fetchExportLogs()]);
      setImportLogs(importsResponse.data.items);
      setExportLogs(exportsResponse.data.items);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load import/export logs");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submitImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rowsText = String(form.get("rows") ?? "[]");
    try {
      const response = await previewImport(String(form.get("type")), {
        fileName: form.get("fileName") || "manual-json.json",
        rows: JSON.parse(rowsText),
        confirm: form.get("confirm") === "on"
      });
      setPreviewRows(response.data.rows);
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot preview import rows");
    }
  }

  async function submitExcelImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const type = String(form.get("type"));
    const file = form.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setError("Excel file is required");
      return;
    }

    try {
      const upload = new FormData();
      upload.set("file", file);
      if (form.get("confirm") === "on") upload.set("confirm", "true");

      const response = await uploadImportFile(type, upload);
      setPreviewRows(response.data.rows);
      if (form.get("confirm") === "on") formElement.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot upload import file");
    }
  }

  async function downloadFile(url: string) {
    const token = getStoredAccessToken();
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });

    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const disposition = response.headers.get("content-disposition") ?? "";
    const match = /filename="([^"]+)"/.exec(disposition);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = match?.[1] ?? "download";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function openExport(type: string, format: string) {
    try {
      await downloadFile(exportUrl(type, { format }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot download export");
    }
  }

  async function downloadTemplate(type: string) {
    try {
      await downloadFile(importTemplateUrl(type));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot download template");
    }
  }

  return (
    <section className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-semibold">Import / Export</h1>
        <p className="mt-2 text-sm text-muted">Tai template, preview JSON rows, xac nhan import va tai file export.</p>
      </div>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Import center</h2>
          <div className="mb-4 flex flex-wrap gap-2">{importTypes.map((type) => <button key={type} className="rounded-md border border-border px-3 py-2 text-sm" type="button" onClick={() => void downloadTemplate(type)}>Template {type}</button>)}</div>
          <form className="mb-4 space-y-3" onSubmit={(event) => void submitExcelImport(event)}>
            <select className="h-10 rounded-md border border-border px-3 text-sm" name="type">{importTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
            <input className="h-10 rounded-md border border-border px-3 text-sm" name="file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
            <label className="flex items-center gap-2 text-sm"><input name="confirm" type="checkbox" /> Confirm import if valid</label>
            <button className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white" type="submit">Upload Excel / Preview</button>
          </form>
          <form className="space-y-3" onSubmit={(event) => void submitImport(event)}>
            <select className="h-10 rounded-md border border-border px-3 text-sm" name="type">{importTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
            <input className="h-10 rounded-md border border-border px-3 text-sm" name="fileName" placeholder="file name" />
            <textarea className="min-h-32 w-full rounded-md border border-border p-3 text-sm" name="rows" placeholder='[{"projectCode":"P001","name":"Demo"}]' />
            <label className="flex items-center gap-2 text-sm"><input name="confirm" type="checkbox" /> Confirm import if valid</label>
            <button className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white" type="submit">Preview / Confirm</button>
          </form>
        </div>

        <div className="rounded-md border border-border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Export center</h2>
          <div className="grid gap-2">
            {exportTypes.map((type) => (
              <div key={type} className="flex items-center justify-between border-b border-border pb-2 text-sm">
                <span>{type}</span>
                <div className="flex gap-2">
                  {["excel", "csv", "pdf"].map((format) => <button key={format} className="text-primary" type="button" onClick={() => void openExport(type, format)}>{format}</button>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {previewRows.length ? (
        <SimpleTable title="Preview import rows" headers={["Row", "Status", "Errors"]} rows={previewRows.map((row) => [row.rowNumber, row.valid ? "Valid" : "Invalid", row.errors.join("; ") || "-"])} />
      ) : null}

      <SimpleTable title="Import logs" headers={["Type", "File", "Status", "Rows", "Failed"]} rows={importLogs.map((log) => [log.importType, log.fileName, log.status, log.totalRows, log.failedRows])} />
      <SimpleTable title="Export logs" headers={["Type", "File", "Format", "Created"]} rows={exportLogs.map((log) => [log.exportType, log.fileName, log.format, new Date(log.createdAt).toLocaleString("vi-VN")])} />
    </section>
  );
}

function SimpleTable({ title, headers, rows }: { title: string; headers: string[]; rows: Array<Array<string | number>> }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-white">
      <div className="border-b border-border p-3 text-base font-semibold">{title}</div>
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-surface text-left text-muted"><tr>{headers.map((header) => <th key={header} className="p-3">{header}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index} className="border-t border-border">{row.map((cell, cellIndex) => <td key={cellIndex} className="p-3">{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
