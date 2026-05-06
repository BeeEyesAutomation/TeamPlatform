"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getStoredUser, hasPermission } from "../../lib/auth";
import type { DocumentPermission, DocumentType } from "../../types/project-documents";
import { fetchDocumentPermissions, fetchDocumentTypes, saveDocumentPermissions } from "./project-documents-api";

const securityLevels = ["", "project_public", "internal_company", "pm_admin_only", "accounting", "confidential", "client_shared"];

export function DocumentPermissionsClient() {
  const user = getStoredUser();
  const canManage = hasPermission(user, "project_documents.manage");
  const [permissions, setPermissions] = useState<DocumentPermission[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [permissionsResponse, typesResponse] = await Promise.all([fetchDocumentPermissions(), fetchDocumentTypes()]);
      setPermissions(permissionsResponse.data);
      setDocumentTypes(typesResponse.data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load document permissions");
    }
  }

  useEffect(() => {
    if (canManage) void load();
  }, [canManage]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await saveDocumentPermissions([{
        documentTypeId: form.get("documentTypeId"),
        roleId: form.get("roleId"),
        securityLevel: form.get("securityLevel") || undefined,
        canView: form.get("canView") === "on",
        canUpload: form.get("canUpload") === "on",
        canEdit: form.get("canEdit") === "on",
        canDelete: form.get("canDelete") === "on",
        canDownload: form.get("canDownload") === "on",
        canApprove: form.get("canApprove") === "on"
      }]);
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save document permission");
    }
  }

  if (!canManage) {
    return <div className="rounded-md border border-border bg-white p-5 text-sm text-muted">Ban khong co quyen cau hinh tai lieu.</div>;
  }

  return (
    <section className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-semibold">Phan quyen tai lieu</h1>
        <p className="mt-2 text-sm text-muted">Cau hinh theo vai tro, loai tai lieu, muc bao mat va hanh dong.</p>
      </div>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <form className="grid gap-3 rounded-md border border-border bg-white p-4 md:grid-cols-4" onSubmit={(event) => void submit(event)}>
        <select className="h-10 rounded-md border border-border px-3 text-sm" name="documentTypeId" required>
          <option value="">Loai tai lieu</option>
          {documentTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
        </select>
        <input className="h-10 rounded-md border border-border px-3 text-sm" name="roleId" placeholder="Role ID" required />
        <select className="h-10 rounded-md border border-border px-3 text-sm" name="securityLevel">
          {securityLevels.map((level) => <option key={level} value={level}>{level || "Tat ca muc"}</option>)}
        </select>
        <button className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white" type="submit">Luu</button>
        {["canView", "canUpload", "canEdit", "canDelete", "canDownload", "canApprove"].map((field) => (
          <label key={field} className="flex items-center gap-2 text-sm"><input name={field} type="checkbox" />{field}</label>
        ))}
      </form>

      <div className="overflow-x-auto rounded-md border border-border bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="p-3">Loai</th>
              <th className="p-3">Vai tro</th>
              <th className="p-3">Bao mat</th>
              <th className="p-3">View</th>
              <th className="p-3">Upload</th>
              <th className="p-3">Edit</th>
              <th className="p-3">Delete</th>
              <th className="p-3">Download</th>
              <th className="p-3">Approve</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission) => (
              <tr key={permission.id} className="border-t border-border">
                <td className="p-3">{permission.documentType?.name ?? permission.documentTypeId}</td>
                <td className="p-3">{permission.role?.code ?? permission.roleId}</td>
                <td className="p-3">{permission.securityLevel ?? "all"}</td>
                <td className="p-3">{permission.canView ? "Yes" : "No"}</td>
                <td className="p-3">{permission.canUpload ? "Yes" : "No"}</td>
                <td className="p-3">{permission.canEdit ? "Yes" : "No"}</td>
                <td className="p-3">{permission.canDelete ? "Yes" : "No"}</td>
                <td className="p-3">{permission.canDownload ? "Yes" : "No"}</td>
                <td className="p-3">{permission.canApprove ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
