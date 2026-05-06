import { describe, expect, it } from "vitest";
import { buildDocumentAccessLogData, canPerformDocumentAction, type DocumentPermissionRule } from "./project-documents.permissions.js";

const baseRule: DocumentPermissionRule = {
  roleCode: "project_manager",
  securityLevel: null,
  canView: true,
  canUpload: true,
  canEdit: true,
  canDelete: false,
  canDownload: true,
  canApprove: false
};

describe("project document permissions", () => {
  it("denies view and download when the role has no matching permission", () => {
    expect(canPerformDocumentAction({
      userRoles: ["project_employee"],
      userPermissions: ["project_documents.view"],
      isProjectMember: true,
      documentSecurityLevel: "internal_company",
      action: "download",
      rules: [baseRule]
    })).toBe(false);
  });

  it("allows view and download when the role has matching permission", () => {
    expect(canPerformDocumentAction({
      userRoles: ["project_manager"],
      userPermissions: ["project_documents.view"],
      isProjectMember: true,
      documentSecurityLevel: "internal_company",
      action: "download",
      rules: [baseRule]
    })).toBe(true);
  });

  it("enforces confidential security-level restrictions", () => {
    expect(canPerformDocumentAction({
      userRoles: ["project_manager"],
      userPermissions: ["project_documents.view"],
      isProjectMember: true,
      documentSecurityLevel: "confidential",
      action: "view",
      rules: [{ ...baseRule, securityLevel: "internal_company" }]
    })).toBe(false);
  });

  it("uses approve permission for approve and reject actions", () => {
    const approveRule = { ...baseRule, canApprove: true };

    expect(canPerformDocumentAction({
      userRoles: ["project_manager"],
      userPermissions: ["project_documents.manage"],
      isProjectMember: true,
      documentSecurityLevel: "confidential",
      action: "approve",
      rules: [approveRule]
    })).toBe(true);
    expect(canPerformDocumentAction({
      userRoles: ["project_manager"],
      userPermissions: ["project_documents.manage"],
      isProjectMember: true,
      documentSecurityLevel: "confidential",
      action: "reject",
      rules: [approveRule]
    })).toBe(true);
  });

  it("builds access log data for document actions", () => {
    expect(buildDocumentAccessLogData({
      documentId: "doc-1",
      userId: "user-1",
      action: "download",
      ipAddress: "127.0.0.1",
      userAgent: "vitest"
    })).toEqual({
      documentId: "doc-1",
      userId: "user-1",
      action: "download",
      ipAddress: "127.0.0.1",
      userAgent: "vitest"
    });
  });
});
