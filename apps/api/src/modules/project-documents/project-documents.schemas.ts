import { z } from "zod";
import { paginationQuerySchema } from "../hr/hr.schemas";

const emptyToUndefined = (value: unknown) => value === "" || value === null ? undefined : value;
const optionalText = z.preprocess(emptyToUndefined, z.string().trim().max(5000).optional());

export const securityLevelSchema = z.enum(["project_public", "internal_company", "pm_admin_only", "accounting", "confidential", "client_shared"]);
export const documentStatusSchema = z.enum(["draft", "pending_approval", "approved", "rejected", "archived"]);

export const idParamSchema = z.object({
  id: z.string().uuid()
});

export const projectIdParamSchema = z.object({
  projectId: z.string().uuid()
});

export const documentTypeCreateSchema = z.object({
  code: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(255),
  description: optionalText,
  status: z.enum(["active", "inactive"]).default("active")
});

export const documentTypeUpdateSchema = documentTypeCreateSchema.partial();

export const documentPermissionSchema = z.object({
  documentTypeId: z.string().uuid(),
  roleId: z.string().uuid(),
  securityLevel: z.preprocess(emptyToUndefined, securityLevelSchema.optional()),
  canView: z.coerce.boolean().default(false),
  canUpload: z.coerce.boolean().default(false),
  canEdit: z.coerce.boolean().default(false),
  canDelete: z.coerce.boolean().default(false),
  canDownload: z.coerce.boolean().default(false),
  canApprove: z.coerce.boolean().default(false)
});

export const documentPermissionsUpsertSchema = z.object({
  permissions: z.array(documentPermissionSchema).min(1)
});

export const documentListQuerySchema = paginationQuerySchema.extend({
  documentTypeId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  securityLevel: z.preprocess(emptyToUndefined, securityLevelSchema.optional()),
  status: z.preprocess(emptyToUndefined, documentStatusSchema.optional())
});

export const documentUploadMetadataSchema = z.object({
  documentTypeId: z.string().uuid(),
  title: z.string().trim().min(1).max(255),
  fileName: z.string().trim().min(1).max(255),
  fileUrl: z.string().trim().min(1).max(2048),
  fileSize: z.coerce.number().int().min(0).optional(),
  mimeType: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  version: z.string().trim().min(1).max(50).default("1"),
  securityLevel: securityLevelSchema,
  status: documentStatusSchema.default("pending_approval"),
  note: optionalText
});

export const documentUpdateMetadataSchema = documentUploadMetadataSchema.omit({ fileUrl: true }).partial().extend({
  fileUrl: z.preprocess(emptyToUndefined, z.string().trim().max(2048).optional())
});

export const rejectDocumentSchema = z.object({
  note: optionalText
});
