export type SecurityLevel = "project_public" | "internal_company" | "pm_admin_only" | "accounting" | "confidential" | "client_shared";
export type DocumentStatus = "draft" | "pending_approval" | "approved" | "rejected" | "archived";
export type RecordStatus = "active" | "inactive";

export interface DocumentType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: RecordStatus;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  documentTypeId: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number | null;
  mimeType?: string | null;
  version: string;
  securityLevel: SecurityLevel;
  status: DocumentStatus;
  note?: string | null;
  documentType?: DocumentType;
}

export interface DocumentPermission {
  id: string;
  documentTypeId: string;
  roleId: string;
  securityLevel?: SecurityLevel | null;
  canView: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canDownload: boolean;
  canApprove: boolean;
  documentType?: DocumentType;
  role?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface DocumentAccessLog {
  id: string;
  documentId: string;
  userId?: string | null;
  action: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface DocumentListResponse {
  items: ProjectDocument[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
