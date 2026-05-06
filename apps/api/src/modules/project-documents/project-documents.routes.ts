import { Router, type Request } from "express";
import { requireAuth, requirePermission } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/async-handler";
import {
  approveProjectDocument,
  archiveProjectDocument,
  createDocumentType,
  getProjectDocumentDownload,
  listDocumentAccessLogs,
  listDocumentPermissions,
  listDocumentTypes,
  listProjectDocuments,
  rejectProjectDocument,
  updateDocumentType,
  updateProjectDocument,
  uploadProjectDocument,
  viewProjectDocument,
  deleteDocumentType,
  upsertDocumentPermissions
} from "./project-documents.service";
import {
  documentListQuerySchema,
  documentPermissionsUpsertSchema,
  documentTypeCreateSchema,
  documentTypeUpdateSchema,
  documentUpdateMetadataSchema,
  documentUploadMetadataSchema,
  idParamSchema,
  projectIdParamSchema,
  rejectDocumentSchema
} from "./project-documents.schemas";

export const documentTypesRouter = Router();
export const documentPermissionsRouter = Router();
export const projectDocumentsRouter = Router();
export const projectDocumentsForProjectRouter = Router();

const contextFromRequest = (req: Request) => ({
  user: req.user,
  ipAddress: req.ip,
  userAgent: req.header("user-agent")
});

documentTypesRouter.use(requireAuth);
documentPermissionsRouter.use(requireAuth);
projectDocumentsRouter.use(requireAuth);
projectDocumentsForProjectRouter.use(requireAuth);

documentTypesRouter.get(
  "/",
  requirePermission("project_documents.view"),
  asyncHandler(async (_req, res) => {
    res.json({ status: "ok", data: await listDocumentTypes() });
  })
);

documentTypesRouter.post(
  "/",
  requirePermission("project_documents.manage"),
  asyncHandler(async (req, res) => {
    const body = documentTypeCreateSchema.parse(req.body);
    res.status(201).json({ status: "ok", data: await createDocumentType(body, contextFromRequest(req)) });
  })
);

documentTypesRouter.put(
  "/:id",
  requirePermission("project_documents.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = documentTypeUpdateSchema.parse(req.body);
    res.json({ status: "ok", data: await updateDocumentType(id, body, contextFromRequest(req)) });
  })
);

documentTypesRouter.delete(
  "/:id",
  requirePermission("project_documents.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ status: "ok", data: await deleteDocumentType(id, contextFromRequest(req)) });
  })
);

documentPermissionsRouter.get(
  "/",
  requirePermission("project_documents.manage"),
  asyncHandler(async (_req, res) => {
    res.json({ status: "ok", data: await listDocumentPermissions() });
  })
);

documentPermissionsRouter.put(
  "/",
  requirePermission("project_documents.manage"),
  asyncHandler(async (req, res) => {
    const body = documentPermissionsUpsertSchema.parse(req.body);
    res.json({ status: "ok", data: await upsertDocumentPermissions(body.permissions, contextFromRequest(req)) });
  })
);

projectDocumentsForProjectRouter.get(
  "/:projectId/documents",
  requirePermission("project_documents.view"),
  asyncHandler(async (req, res) => {
    const { projectId } = projectIdParamSchema.parse(req.params);
    const query = documentListQuerySchema.parse(req.query);
    res.json({ status: "ok", data: await listProjectDocuments(projectId, query, contextFromRequest(req)) });
  })
);

projectDocumentsForProjectRouter.post(
  "/:projectId/documents/upload",
  requirePermission("project_documents.upload"),
  asyncHandler(async (req, res) => {
    const { projectId } = projectIdParamSchema.parse(req.params);
    const body = documentUploadMetadataSchema.parse(req.body);
    res.status(201).json({ status: "ok", data: await uploadProjectDocument(projectId, body, contextFromRequest(req)) });
  })
);

projectDocumentsRouter.get(
  "/:id",
  requirePermission("project_documents.view"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ status: "ok", data: await viewProjectDocument(id, contextFromRequest(req)) });
  })
);

projectDocumentsRouter.put(
  "/:id",
  requirePermission("project_documents.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = documentUpdateMetadataSchema.parse(req.body);
    res.json({ status: "ok", data: await updateProjectDocument(id, body, contextFromRequest(req)) });
  })
);

projectDocumentsRouter.delete(
  "/:id",
  requirePermission("project_documents.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ status: "ok", data: await archiveProjectDocument(id, contextFromRequest(req)) });
  })
);

projectDocumentsRouter.get(
  "/:id/download",
  requirePermission("project_documents.download"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ status: "ok", data: await getProjectDocumentDownload(id, contextFromRequest(req)) });
  })
);

projectDocumentsRouter.post(
  "/:id/approve",
  requirePermission("project_documents.approve"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ status: "ok", data: await approveProjectDocument(id, contextFromRequest(req)) });
  })
);

projectDocumentsRouter.post(
  "/:id/reject",
  requirePermission("project_documents.approve"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = rejectDocumentSchema.parse(req.body);
    res.json({ status: "ok", data: await rejectProjectDocument(id, body, contextFromRequest(req)) });
  })
);

projectDocumentsRouter.get(
  "/:id/access-logs",
  requirePermission("project_documents.view"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ status: "ok", data: await listDocumentAccessLogs(id, contextFromRequest(req)) });
  })
);
