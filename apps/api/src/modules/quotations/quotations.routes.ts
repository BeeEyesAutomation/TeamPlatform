import { Router, type Request } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireAuth, requirePermission } from "../../middleware/rbac";
import { AppError } from "../../utils/app-error";
import { asyncHandler } from "../../utils/async-handler";
import {
  companySettingsSchema,
  idParamSchema,
  quotationCodePreviewQuerySchema,
  quotationCreateSchema,
  quotationQuerySchema,
  quotationUpdateSchema,
  templateMappingSchema,
  templateQuerySchema,
  templateUpdateSchema,
  versionParamSchema
} from "./quotations.schemas";
import {
  addQuotationImage,
  approveQuotationVersion,
  buildQuotationPreview,
  cancelQuotationVersion,
  createQuotation,
  createStockOutFromVersion,
  createUpdateFromVersion,
  deleteQuotation,
  deleteQuotationImage,
  deleteQuotationTemplate,
  exportQuotationExcel,
  getCompanySettings,
  getQuotation,
  getQuotationTemplate,
  getQuotationVersion,
  listQuotationTemplates,
  listQuotationVersions,
  listQuotations,
  previewNextQuotationCode,
  rejectQuotationVersion,
  setDefaultQuotationTemplate,
  syncProjectMaterials,
  updateCompanySettings,
  updateQuotation,
  updateQuotationSignature,
  updateQuotationTemplate,
  updateQuotationTemplateMapping,
  uploadCustomerPo,
  uploadQuotationTemplate
} from "./quotations.service";

export const quotationsRouter = Router();
export const quotationTemplatesRouter = Router();
export const quotationSettingsRouter = Router();

const routeDir = path.dirname(fileURLToPath(import.meta.url));
const quotationUploadDir = path.resolve(routeDir, "../../../uploads/quotations");
fs.mkdirSync(quotationUploadDir, { recursive: true });

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedTemplateTypes = new Set(["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/octet-stream"]);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, quotationUploadDir),
    filename: (req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-");
      const id = "id" in req.params ? req.params.id : "template";
      cb(null, `${id}-${Date.now()}-${safeName}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isExcel = file.originalname.toLowerCase().endsWith(".xlsx") && allowedTemplateTypes.has(file.mimetype);
    if (allowedImageTypes.has(file.mimetype) || isExcel) {
      cb(null, true);
      return;
    }
    cb(new AppError(400, "Only jpg, jpeg, png, webp, and xlsx files are supported."));
  }
});

const contextFromRequest = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.header("user-agent")
});

quotationsRouter.use(requireAuth);
quotationTemplatesRouter.use(requireAuth);
quotationSettingsRouter.use(requireAuth);

quotationSettingsRouter.get(
  "/company",
  requirePermission("quotations.view"),
  asyncHandler(async (_req, res) => {
    res.json({ status: "ok", data: await getCompanySettings() });
  })
);

quotationSettingsRouter.put(
  "/company",
  requirePermission("quotation_settings.manage"),
  asyncHandler(async (req, res) => {
    const body = companySettingsSchema.parse(req.body);
    res.json({ status: "ok", data: await updateCompanySettings(body, contextFromRequest(req)) });
  })
);

quotationTemplatesRouter.get(
  "/",
  requirePermission("quotation_templates.view"),
  asyncHandler(async (req, res) => {
    const query = templateQuerySchema.parse(req.query);
    res.json({ status: "ok", data: await listQuotationTemplates(query) });
  })
);

quotationTemplatesRouter.post(
  "/upload",
  requirePermission("quotation_templates.manage"),
  upload.single("template"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError(400, "Template file is required.");
    res.status(201).json({ status: "ok", data: await uploadQuotationTemplate(req.file, contextFromRequest(req)) });
  })
);

quotationTemplatesRouter.get(
  "/:id",
  requirePermission("quotation_templates.view"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ status: "ok", data: await getQuotationTemplate(id) });
  })
);

quotationTemplatesRouter.put(
  "/:id",
  requirePermission("quotation_templates.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = templateUpdateSchema.parse(req.body);
    res.json({ status: "ok", data: await updateQuotationTemplate(id, body, contextFromRequest(req)) });
  })
);

quotationTemplatesRouter.put(
  "/:id/mapping",
  requirePermission("quotation_templates.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = templateMappingSchema.parse(req.body);
    res.json({ status: "ok", data: await updateQuotationTemplateMapping(id, body, contextFromRequest(req)) });
  })
);

quotationTemplatesRouter.post(
  "/:id/set-default",
  requirePermission("quotation_templates.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ status: "ok", data: await setDefaultQuotationTemplate(id, contextFromRequest(req)) });
  })
);

quotationTemplatesRouter.delete(
  "/:id",
  requirePermission("quotation_templates.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ status: "ok", data: await deleteQuotationTemplate(id, contextFromRequest(req)) });
  })
);

quotationsRouter.get(
  "/",
  requirePermission("quotations.view"),
  asyncHandler(async (req, res) => {
    const query = quotationQuerySchema.parse(req.query);
    res.json({ status: "ok", data: await listQuotations(query) });
  })
);

quotationsRouter.get(
  "/next-code",
  requirePermission("quotations.view"),
  asyncHandler(async (req, res) => {
    const query = quotationCodePreviewQuerySchema.parse(req.query);
    res.json({ status: "ok", data: await previewNextQuotationCode(query.date) });
  })
);

quotationsRouter.delete(
  "/images/:id",
  requirePermission("quotations.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ status: "ok", data: await deleteQuotationImage(id, contextFromRequest(req)) });
  })
);

quotationsRouter.post(
  "/",
  requirePermission("quotations.manage"),
  asyncHandler(async (req, res) => {
    const body = quotationCreateSchema.parse(req.body);
    res.status(201).json({ status: "ok", data: await createQuotation(body, contextFromRequest(req)) });
  })
);

quotationsRouter.get(
  "/:id/versions",
  requirePermission("quotations.version.view"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ status: "ok", data: await listQuotationVersions(id) });
  })
);

quotationsRouter.get(
  "/:id/versions/:versionId",
  requirePermission("quotations.version.view"),
  asyncHandler(async (req, res) => {
    const { id, versionId } = versionParamSchema.parse(req.params);
    res.json({ status: "ok", data: await getQuotationVersion(id, versionId) });
  })
);

quotationsRouter.post(
  "/:id/versions/:versionId/create-update",
  requirePermission("quotations.version.create"),
  asyncHandler(async (req, res) => {
    const { id, versionId } = versionParamSchema.parse(req.params);
    const body = quotationUpdateSchema.parse(req.body);
    res.json({ status: "ok", data: await createUpdateFromVersion(id, versionId, body, contextFromRequest(req)) });
  })
);

quotationsRouter.get(
  "/:id/preview",
  requirePermission("quotations.preview"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ status: "ok", data: await buildQuotationPreview(id) });
  })
);

quotationsRouter.get(
  "/:id/versions/:versionId/preview",
  requirePermission("quotations.preview"),
  asyncHandler(async (req, res) => {
    const { id, versionId } = versionParamSchema.parse(req.params);
    res.json({ status: "ok", data: await buildQuotationPreview(id, versionId) });
  })
);

quotationsRouter.get(
  "/:id/export/excel",
  requirePermission("quotations.export"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const file = await exportQuotationExcel(id, contextFromRequest(req));
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${file.fileName}"`);
    res.send(file.buffer);
  })
);

quotationsRouter.get(
  "/:id/versions/:versionId/export/excel",
  requirePermission("quotations.export"),
  asyncHandler(async (req, res) => {
    const { id, versionId } = versionParamSchema.parse(req.params);
    const file = await exportQuotationExcel(id, contextFromRequest(req), versionId);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${file.fileName}"`);
    res.send(file.buffer);
  })
);

quotationsRouter.post(
  "/:id/images",
  requirePermission("quotations.manage"),
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    if (!req.file) throw new AppError(400, "Image file is required.");
    res.status(201).json({ status: "ok", data: await addQuotationImage(id, req.file, contextFromRequest(req)) });
  })
);

quotationsRouter.post(
  "/:id/signature",
  requirePermission("quotations.manage"),
  upload.single("signature"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    if (!req.file) throw new AppError(400, "Signature image is required.");
    res.json({ status: "ok", data: await updateQuotationSignature(id, req.file, contextFromRequest(req)) });
  })
);

quotationsRouter.post(
  "/:id/versions/:versionId/customer-po",
  requirePermission("quotations.customer_po.upload"),
  upload.single("customerPo"),
  asyncHandler(async (req, res) => {
    const { id, versionId } = versionParamSchema.parse(req.params);
    if (!req.file) throw new AppError(400, "Customer PO file is required.");
    res.json({ status: "ok", data: await uploadCustomerPo(id, versionId, req.file, contextFromRequest(req)) });
  })
);

quotationsRouter.post("/:id/versions/:versionId/approve", requirePermission("quotations.approve"), asyncHandler(async (req, res) => {
  const { id, versionId } = versionParamSchema.parse(req.params);
  res.json({ status: "ok", data: await approveQuotationVersion(id, versionId, contextFromRequest(req)) });
}));

quotationsRouter.post("/:id/versions/:versionId/reject", requirePermission("quotations.approve"), asyncHandler(async (req, res) => {
  const { id, versionId } = versionParamSchema.parse(req.params);
  res.json({ status: "ok", data: await rejectQuotationVersion(id, versionId, contextFromRequest(req)) });
}));

quotationsRouter.post("/:id/versions/:versionId/cancel", requirePermission("quotations.approve"), asyncHandler(async (req, res) => {
  const { id, versionId } = versionParamSchema.parse(req.params);
  res.json({ status: "ok", data: await cancelQuotationVersion(id, versionId, contextFromRequest(req)) });
}));

quotationsRouter.post("/:id/versions/:versionId/stock-out", requirePermission("quotations.stock_out"), asyncHandler(async (req, res) => {
  const { id, versionId } = versionParamSchema.parse(req.params);
  res.json({ status: "ok", data: await createStockOutFromVersion(id, versionId, contextFromRequest(req)) });
}));

quotationsRouter.post("/:id/versions/:versionId/sync-project-materials", requirePermission("quotations.manage"), asyncHandler(async (req, res) => {
  const { id, versionId } = versionParamSchema.parse(req.params);
  res.json({ status: "ok", data: await syncProjectMaterials(id, versionId, contextFromRequest(req)) });
}));

quotationsRouter.get("/:id", requirePermission("quotations.view"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ status: "ok", data: await getQuotation(id) });
}));

quotationsRouter.put("/:id", requirePermission("quotations.manage"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = quotationUpdateSchema.parse(req.body);
  res.json({ status: "ok", data: await updateQuotation(id, body, contextFromRequest(req)) });
}));

quotationsRouter.delete("/:id", requirePermission("quotations.delete"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ status: "ok", data: await deleteQuotation(id, contextFromRequest(req)) });
}));
