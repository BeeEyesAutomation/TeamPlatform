import { apiGet, apiJson } from "../../lib/api-client";
import type { DocumentAccessLog, DocumentListResponse, DocumentPermission, DocumentType, ProjectDocument } from "../../types/project-documents";

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const fetchDocumentTypes = () => apiGet<DocumentType[]>("/api/document-types");
export const saveDocumentType = (body: Record<string, unknown>, id?: string) =>
  id ? apiJson<DocumentType>(`/api/document-types/${id}`, "PUT", body) : apiJson<DocumentType>("/api/document-types", "POST", body);
export const deleteDocumentType = (id: string) => apiJson<DocumentType>(`/api/document-types/${id}`, "DELETE");

export const fetchDocumentPermissions = () => apiGet<DocumentPermission[]>("/api/document-permissions");
export const saveDocumentPermissions = (permissions: Array<Record<string, unknown>>) =>
  apiJson<DocumentPermission[]>("/api/document-permissions", "PUT", { permissions });

export const fetchProjectDocuments = (projectId: string, params: Record<string, string | number | undefined> = {}) =>
  apiGet<DocumentListResponse>(`/api/projects/${projectId}/documents${buildQuery(params)}`);
export const uploadProjectDocument = (projectId: string, body: Record<string, unknown>) =>
  apiJson<ProjectDocument>(`/api/projects/${projectId}/documents/upload`, "POST", body);
export const fetchProjectDocument = (id: string) => apiGet<ProjectDocument>(`/api/project-documents/${id}`);
export const updateProjectDocument = (id: string, body: Record<string, unknown>) => apiJson<ProjectDocument>(`/api/project-documents/${id}`, "PUT", body);
export const archiveProjectDocument = (id: string) => apiJson<ProjectDocument>(`/api/project-documents/${id}`, "DELETE");
export const approveProjectDocument = (id: string) => apiJson<ProjectDocument>(`/api/project-documents/${id}/approve`, "POST");
export const rejectProjectDocument = (id: string, note?: string) => apiJson<ProjectDocument>(`/api/project-documents/${id}/reject`, "POST", { note });
export const fetchDocumentDownload = (id: string) => apiGet<{ id: string; fileName: string; fileUrl: string }>(`/api/project-documents/${id}/download`);
export const fetchDocumentAccessLogs = (id: string) => apiGet<DocumentAccessLog[]>(`/api/project-documents/${id}/access-logs`);
