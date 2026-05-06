"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getStoredUser, hasPermission } from "../../lib/auth";
import type { DocumentAccessLog, DocumentType, ProjectDocument } from "../../types/project-documents";
import {
  approveProjectDocument,
  archiveProjectDocument,
  fetchDocumentAccessLogs,
  fetchDocumentDownload,
  fetchDocumentTypes,
  fetchProjectDocuments,
  rejectProjectDocument,
  uploadProjectDocument
} from "./project-documents-api";

const securityLevels = ["project_public", "internal_company", "pm_admin_only", "accounting", "confidential", "client_shared"];

export function ProjectDocumentsPanel({ projectId }: { projectId: string }) {
  const user = getStoredUser();
  const canUpload = hasPermission(user, "project_documents.upload");
  const canDownload = hasPermission(user, "project_documents.download");
  const canApprove = hasPermission(user, "project_documents.approve");
  const canManage = hasPermission(user, "project_documents.manage");
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [logs, setLogs] = useState<DocumentAccessLog[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [documentsResponse, typesResponse] = await Promise.all([
        fetchProjectDocuments(projectId, { pageSize: 100 }),
        fetchDocumentTypes()
      ]);
      setDocuments(documentsResponse.data.items);
      setDocumentTypes(typesResponse.data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load documents");
    }
  }

  useEffect(() => {
    void load();
  }, [projectId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await uploadProjectDocument(projectId, body);
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot upload document metadata");
    }
  }

  async function run(action: () => Promise<unknown>) {
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot update document");
    }
  }

  async function openLogs(id: string) {
    try {
      const response = await fetchDocumentAccessLogs(id);
      setLogs(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load access logs");
    }
  }

  return (
    <div className="space-y-4">
      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      {canUpload ? (
        <form className="grid gap-2 rounded-md border border-border bg-white p-3 md:grid-cols-4" onSubmit={(event) => void submit(event)}>
          <input className="h-10 rounded-md border border-border px-3 text-sm" name="title" placeholder="Tieu de" required />
          <select className="h-10 rounded-md border border-border px-3 text-sm" name="documentTypeId" required>
            <option value="">Loai tai lieu</option>
            {documentTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
          </select>
          <select className="h-10 rounded-md border border-border px-3 text-sm" name="securityLevel" required>
            {securityLevels.map((level) => <option key={level} value={level}>{level}</option>)}
          </select>
          <input className="h-10 rounded-md border border-border px-3 text-sm" name="version" placeholder="Phien ban" defaultValue="1" />
          <input className="h-10 rounded-md border border-border px-3 text-sm" name="fileName" placeholder="Ten file" required />
          <input className="h-10 rounded-md border border-border px-3 text-sm" name="fileUrl" placeholder="URL/path" required />
          <input className="h-10 rounded-md border border-border px-3 text-sm" name="mimeType" placeholder="MIME type" />
          <button className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white" type="submit">Them metadata</button>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-md border border-border bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="p-3">Tai lieu</th>
              <th className="p-3">Loai</th>
              <th className="p-3">Bao mat</th>
              <th className="p-3">Trang thai</th>
              <th className="p-3">File</th>
              <th className="p-3">Xu ly</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr key={document.id} className="border-t border-border">
                <td className="p-3 font-medium">{document.title}</td>
                <td className="p-3">{document.documentType?.name ?? document.documentTypeId}</td>
                <td className="p-3">{document.securityLevel}</td>
                <td className="p-3">{document.status}</td>
                <td className="p-3">{document.fileName}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {canDownload ? <button className="text-primary" type="button" onClick={() => void run(() => fetchDocumentDownload(document.id))}>Tai</button> : null}
                    {canApprove ? <button className="text-primary" type="button" onClick={() => void run(() => approveProjectDocument(document.id))}>Duyet</button> : null}
                    {canApprove ? <button className="text-primary" type="button" onClick={() => void run(() => rejectProjectDocument(document.id))}>Tu choi</button> : null}
                    {canManage ? <button className="text-primary" type="button" onClick={() => void run(() => archiveProjectDocument(document.id))}>Luu tru</button> : null}
                    <button className="text-primary" type="button" onClick={() => void openLogs(document.id)}>Log</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {logs.length ? (
        <div className="rounded-md border border-border bg-white p-4">
          <h3 className="mb-3 text-base font-semibold">Access logs</h3>
          <div className="space-y-2 text-sm">
            {logs.map((log) => <div key={log.id} className="flex justify-between border-b border-border pb-2"><span>{log.action}</span><span>{new Date(log.createdAt).toLocaleString("vi-VN")}</span></div>)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
