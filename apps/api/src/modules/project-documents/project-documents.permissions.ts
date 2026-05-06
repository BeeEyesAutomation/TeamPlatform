import type { SecurityLevel } from "@prisma/client";

export type DocumentPermissionAction = "view" | "upload" | "edit" | "delete" | "download" | "approve" | "reject";

export interface DocumentPermissionRule {
  roleCode: string;
  securityLevel: SecurityLevel | null;
  canView: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canDownload: boolean;
  canApprove: boolean;
}

export interface DocumentPermissionInput {
  userRoles: string[];
  userPermissions: string[];
  isProjectMember: boolean;
  documentSecurityLevel: SecurityLevel;
  action: DocumentPermissionAction;
  rules: DocumentPermissionRule[];
}

const actionField: Record<DocumentPermissionAction, keyof Omit<DocumentPermissionRule, "roleCode" | "securityLevel">> = {
  view: "canView",
  upload: "canUpload",
  edit: "canEdit",
  delete: "canDelete",
  download: "canDownload",
  approve: "canApprove",
  reject: "canApprove"
};

export function canPerformDocumentAction(input: DocumentPermissionInput) {
  if (input.userRoles.includes("admin") && input.userPermissions.includes("project_documents.manage")) {
    return true;
  }

  if (!input.isProjectMember) {
    return false;
  }

  const permissionField = actionField[input.action];

  return input.rules.some((rule) =>
    input.userRoles.includes(rule.roleCode) &&
    (rule.securityLevel === null || rule.securityLevel === input.documentSecurityLevel) &&
    rule[permissionField]
  );
}

export function buildDocumentAccessLogData(input: {
  documentId: string;
  userId?: string | null;
  action: DocumentPermissionAction;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  return {
    documentId: input.documentId,
    userId: input.userId ?? null,
    action: input.action,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null
  };
}
