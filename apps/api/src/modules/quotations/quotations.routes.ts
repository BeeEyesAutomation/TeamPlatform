import { Router, type Request } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireAuth, requirePermission } from "../../middleware/rbac";
import { AppError } from "../../utils/app-error";
import { asyncHandler } from "../../utils/async-handler";
import {
  idParamSchema,
  quotationCodePreviewQuerySchema,
  quotationCreateSchema,
  quotationQuerySchema,
  quotationUpdateSchema
} from "./quotations.schemas";
import {
  addQuotationImage,
  createQuotation,
  deleteQuotation,
  deleteQuotationImage,
  exportQuotationExcel,
  getQuotation,
  listQuotations,
  previewNextQuotationCode,
  updateQuotationSignature,
  updateQuotation
} from "./quotations.service";

export const quotationsRouter = Router();

const routeDir = path.dirname(fileURLToPath(import.meta.url));
const quotationUploadDir = path.resolve(routeDir, "../../../uploads/quotations");
fs.mkdirSync(quotationUploadDir, { recursive: true });

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const quotationImageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, quotationUploadDir),
    filename: (req, file, cb) => {
      const { id } = idParamSchema.parse(req.params);
      const extension = path.extname(file.originalname).toLowerCase() || ".jpg";
      cb(null, `${id}-${Date.now()}${extension}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      cb(new AppError(400, "Only jpg, jpeg, png, and webp images are supported."));
      return;
    }
    cb(null, true);
  }
});

const contextFromRequest = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.header("user-agent")
});

quotationsRouter.use(requireAuth);

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

quotationsRouter.post(
  "/:id/images",
  requirePermission("quotations.manage"),
  quotationImageUpload.single("image"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    if (!req.file) throw new AppError(400, "Image file is required.");
    res.status(201).json({ status: "ok", data: await addQuotationImage(id, req.file, contextFromRequest(req)) });
  })
);

quotationsRouter.post(
  "/:id/signature",
  requirePermission("quotations.manage"),
  quotationImageUpload.single("signature"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    if (!req.file) throw new AppError(400, "Signature image is required.");
    res.json({ status: "ok", data: await updateQuotationSignature(id, req.file, contextFromRequest(req)) });
  })
);

quotationsRouter.get(
  "/:id",
  requirePermission("quotations.view"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ status: "ok", data: await getQuotation(id) });
  })
);

quotationsRouter.put(
  "/:id",
  requirePermission("quotations.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = quotationUpdateSchema.parse(req.body);
    res.json({ status: "ok", data: await updateQuotation(id, body, contextFromRequest(req)) });
  })
);

quotationsRouter.delete(
  "/:id",
  requirePermission("quotations.delete"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ status: "ok", data: await deleteQuotation(id, contextFromRequest(req)) });
  })
);
