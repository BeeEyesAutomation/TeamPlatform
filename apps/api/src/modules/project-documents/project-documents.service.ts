import type { DocumentAction, ProjectDocument, SecurityLevel } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { AppError } from "../../utils/app-error";
import { createAuditLog } from "../audit/audit.service";
import { getPagination, getPaginationMeta, handlePrismaError } from "../hr/hr.utils";
import { buildDocumentAccessLogData, canPerformDocumentAction, type DocumentPermissionAction } from "./project-documents.permissions";
import type { z } from "zod";
import type {
  documentListQuerySchema,
  documentPermissionSchema,
  documentTypeCreateSchema,
  documentTypeUpdateSchema,
  documentUpdateMetadataSchema,
  documentUploadMetadataSchema,
  rejectDocumentSchema
} from "./project-documents.schemas";

type DocumentListQuery = z.infer<typeof documentListQuerySchema>;
type DocumentTypeCreate = z.infer<typeof documentTypeCreateSchema>;
type DocumentTypeUpdate = z.infer<typeof documentTypeUpdateSchema>;
type DocumentPermissionInput = z.infer<typeof documentPermissionSchema>;
type DocumentUploadMetadata = z.infer<typeof documentUploadMetadataSchema>;
type DocumentUpdateMetadata = z.infer<typeof documentUpdateMetadataSchema>;
type RejectDocumentInput = z.infer<typeof rejectDocumentSchema>;

interface RequestContext {
  user?: Express.Request["user"];
  ipAddress?: string;
  userAgent?: string;
}

const documentInclude = {
  documentType: true,
  project: {
    select: {
      id: true,
      projectCode: true,
      name: true
    }
  }
};

function requireUser(context: RequestContext) {
  if (!context.user) {
    throw new AppError(401, "Authentication required");
  }

  return context.user;
}

async function isProjectMember(projectId: string, employeeId?: string | null) {
  if (!employeeId) {
    return false;
  }

  const member = await prisma.projectMember.findFirst({
    where: {
      projectId,
      employeeId,
      status: "active"
    },
    select: { id: true }
  });

  return Boolean(member);
}

async function getRules(documentTypeId: string, roleCodes: string[]) {
  const permissions = await prisma.documentPermission.findMany({
    where: {
      documentTypeId,
      role: {
        code: {
          in: roleCodes
        }
      }
    },
    include: {
      role: {
        select: {
          code: true
        }
      }
    }
  });

  return permissions.map((permission) => ({
    roleCode: permission.role.code,
    securityLevel: permission.securityLevel,
    canView: permission.canView,
    canUpload: permission.canUpload,
    canEdit: permission.canEdit,
    canDelete: permission.canDelete,
    canDownload: permission.canDownload,
    canApprove: permission.canApprove
  }));
}

async function assertDocumentAccess(input: {
  projectId: string;
  documentTypeId: string;
  securityLevel: SecurityLevel;
  action: DocumentPermissionAction;
  context: RequestContext;
}) {
  const user = requireUser(input.context);
  const allowed = canPerformDocumentAction({
    userRoles: user.roles,
    userPermissions: user.permissions,
    isProjectMember: await isProjectMember(input.projectId, user.employeeId),
    documentSecurityLevel: input.securityLevel,
    action: input.action,
    rules: await getRules(input.documentTypeId, user.roles)
  });

  if (!allowed) {
    throw new AppError(403, "Document permission denied");
  }
}

async function logDocumentAccess(documentId: string, action: DocumentPermissionAction, context: RequestContext, metadata?: unknown) {
  const user = requireUser(context);
  return prisma.documentAccessLog.create({
    data: {
      ...buildDocumentAccessLogData({
        documentId,
        userId: user.id,
        action,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      }),
      metadata: metadata as any
    }
  });
}

async function auditDocumentChange(input: {
  action: string;
  documentId?: string;
  projectId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  context: RequestContext;
}) {
  await createAuditLog({
    actorId: input.context.user?.id,
    action: input.action,
    module: "project_documents",
    targetType: "project_document",
    targetId: input.documentId,
    oldValue: input.oldValue,
    newValue: input.newValue,
    metadata: {
      projectId: input.projectId
    },
    ipAddress: input.context.ipAddress,
    userAgent: input.context.userAgent
  });
}

async function getDocumentOrThrow(id: string) {
  const document = await prisma.projectDocument.findFirst({
    where: {
      id,
      deletedAt: null
    },
    include: documentInclude
  });

  if (!document) {
    throw new AppError(404, "Project document not found");
  }

  return document;
}

export async function listDocumentTypes() {
  return prisma.documentType.findMany({
    where: { deletedAt: null },
    orderBy: [{ status: "asc" }, { name: "asc" }]
  });
}

export async function createDocumentType(data: DocumentTypeCreate, context: RequestContext) {
  try {
    const documentType = await prisma.documentType.create({ data });
    await createAuditLog({
      actorId: context.user?.id,
      action: "create_document_type",
      module: "project_documents",
      targetType: "document_type",
      targetId: documentType.id,
      newValue: documentType,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });
    return documentType;
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function updateDocumentType(id: string, data: DocumentTypeUpdate, context: RequestContext) {
  const existing = await prisma.documentType.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new AppError(404, "Document type not found");

  const documentType = await prisma.documentType.update({ where: { id }, data });
  await createAuditLog({
    actorId: context.user?.id,
    action: "update_document_type",
    module: "project_documents",
    targetType: "document_type",
    targetId: id,
    oldValue: existing,
    newValue: documentType,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });
  return documentType;
}

export async function deleteDocumentType(id: string, context: RequestContext) {
  const existing = await prisma.documentType.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new AppError(404, "Document type not found");

  const documentType = await prisma.documentType.update({
    where: { id },
    data: {
      status: "inactive",
      deletedAt: new Date()
    }
  });
  await createAuditLog({
    actorId: context.user?.id,
    action: "delete_document_type",
    module: "project_documents",
    targetType: "document_type",
    targetId: id,
    oldValue: existing,
    newValue: documentType,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });
  return documentType;
}

export async function listDocumentPermissions() {
  return prisma.documentPermission.findMany({
    include: {
      documentType: true,
      role: true
    },
    orderBy: [{ documentType: { code: "asc" } }, { role: { code: "asc" } }]
  });
}

export async function upsertDocumentPermissions(inputs: DocumentPermissionInput[], context: RequestContext) {
  const results = [];

  for (const input of inputs) {
    const existing = await prisma.documentPermission.findFirst({
      where: {
        documentTypeId: input.documentTypeId,
        roleId: input.roleId,
        securityLevel: input.securityLevel ?? null
      }
    });
    const permission = existing
      ? await prisma.documentPermission.update({
        where: { id: existing.id },
        data: input,
        include: {
          documentType: true,
          role: true
        }
      })
      : await prisma.documentPermission.create({
        data: input,
        include: {
          documentType: true,
          role: true
        }
      });
    results.push(permission);
  }

  await createAuditLog({
    actorId: context.user?.id,
    action: "upsert_document_permissions",
    module: "project_documents",
    targetType: "document_permission",
    newValue: results,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return results;
}

export async function listProjectDocuments(projectId: string, query: DocumentListQuery, context: RequestContext) {
  const pagination = getPagination(query);
  const where = {
    projectId,
    deletedAt: null,
    ...(query.documentTypeId ? { documentTypeId: query.documentTypeId } : {}),
    ...(query.securityLevel ? { securityLevel: query.securityLevel } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: "insensitive" as const } },
            { fileName: { contains: query.search, mode: "insensitive" as const } }
          ]
        }
      : {})
  };
  const documents = await prisma.projectDocument.findMany({
    where,
    include: documentInclude,
    orderBy: { createdAt: "desc" },
    ...pagination
  });
  const visible = [];

  for (const document of documents) {
    try {
      await assertDocumentAccess({
        projectId: document.projectId,
        documentTypeId: document.documentTypeId,
        securityLevel: document.securityLevel,
        action: "view",
        context
      });
      visible.push(document);
    } catch (error) {
      if (!(error instanceof AppError) || error.statusCode !== 403) {
        throw error;
      }
    }
  }

  return {
    items: visible,
    meta: getPaginationMeta(query, await prisma.projectDocument.count({ where }))
  };
}

export async function uploadProjectDocument(projectId: string, data: DocumentUploadMetadata, context: RequestContext) {
  await assertDocumentAccess({
    projectId,
    documentTypeId: data.documentTypeId,
    securityLevel: data.securityLevel,
    action: "upload",
    context
  });

  const document = await prisma.projectDocument.create({
    data: {
      ...data,
      projectId,
      uploadedById: context.user?.id
    },
    include: documentInclude
  });

  await logDocumentAccess(document.id, "upload", context);
  await auditDocumentChange({ action: "upload", documentId: document.id, projectId, newValue: document, context });
  return document;
}

export async function viewProjectDocument(id: string, context: RequestContext) {
  const document = await getDocumentOrThrow(id);
  await assertDocumentAccess({
    projectId: document.projectId,
    documentTypeId: document.documentTypeId,
    securityLevel: document.securityLevel,
    action: "view",
    context
  });
  await logDocumentAccess(document.id, "view", context);
  return document;
}

export async function updateProjectDocument(id: string, data: DocumentUpdateMetadata, context: RequestContext) {
  const existing = await getDocumentOrThrow(id);
  await assertDocumentAccess({
    projectId: existing.projectId,
    documentTypeId: existing.documentTypeId,
    securityLevel: existing.securityLevel,
    action: "edit",
    context
  });

  const document = await prisma.projectDocument.update({
    where: { id },
    data,
    include: documentInclude
  });

  await logDocumentAccess(document.id, "edit", context);
  await auditDocumentChange({ action: "edit", documentId: id, projectId: existing.projectId, oldValue: existing, newValue: document, context });
  return document;
}

export async function archiveProjectDocument(id: string, context: RequestContext) {
  const existing = await getDocumentOrThrow(id);
  await assertDocumentAccess({
    projectId: existing.projectId,
    documentTypeId: existing.documentTypeId,
    securityLevel: existing.securityLevel,
    action: "delete",
    context
  });

  const document = await prisma.projectDocument.update({
    where: { id },
    data: {
      status: "archived",
      deletedAt: new Date()
    },
    include: documentInclude
  });

  await logDocumentAccess(document.id, "delete", context);
  await auditDocumentChange({ action: "delete", documentId: id, projectId: existing.projectId, oldValue: existing, newValue: document, context });
  return document;
}

export async function approveProjectDocument(id: string, context: RequestContext) {
  const existing = await getDocumentOrThrow(id);
  await assertDocumentAccess({
    projectId: existing.projectId,
    documentTypeId: existing.documentTypeId,
    securityLevel: existing.securityLevel,
    action: "approve",
    context
  });

  const document = await prisma.projectDocument.update({
    where: { id },
    data: {
      status: "approved",
      approvedById: context.user?.id,
      approvedAt: new Date()
    },
    include: documentInclude
  });

  await logDocumentAccess(document.id, "approve", context);
  await auditDocumentChange({ action: "approve", documentId: id, projectId: existing.projectId, oldValue: existing, newValue: document, context });
  return document;
}

export async function rejectProjectDocument(id: string, data: RejectDocumentInput, context: RequestContext) {
  const existing = await getDocumentOrThrow(id);
  await assertDocumentAccess({
    projectId: existing.projectId,
    documentTypeId: existing.documentTypeId,
    securityLevel: existing.securityLevel,
    action: "reject",
    context
  });

  const document = await prisma.projectDocument.update({
    where: { id },
    data: {
      status: "rejected",
      note: data.note ?? existing.note
    },
    include: documentInclude
  });

  await logDocumentAccess(document.id, "reject", context);
  await auditDocumentChange({ action: "reject", documentId: id, projectId: existing.projectId, oldValue: existing, newValue: document, context });
  return document;
}

export async function getProjectDocumentDownload(id: string, context: RequestContext) {
  const document = await getDocumentOrThrow(id);
  await assertDocumentAccess({
    projectId: document.projectId,
    documentTypeId: document.documentTypeId,
    securityLevel: document.securityLevel,
    action: "download",
    context
  });
  await logDocumentAccess(document.id, "download", context);
  return {
    id: document.id,
    fileName: document.fileName,
    fileUrl: document.fileUrl,
    mimeType: document.mimeType,
    fileSize: document.fileSize
  };
}

export async function listDocumentAccessLogs(id: string, context: RequestContext) {
  const document = await getDocumentOrThrow(id);
  await assertDocumentAccess({
    projectId: document.projectId,
    documentTypeId: document.documentTypeId,
    securityLevel: document.securityLevel,
    action: "view",
    context
  });

  return prisma.documentAccessLog.findMany({
    where: { documentId: id },
    orderBy: { createdAt: "desc" },
    take: 100
  });
}

export type ProjectDocumentWithAccess = ProjectDocument;
