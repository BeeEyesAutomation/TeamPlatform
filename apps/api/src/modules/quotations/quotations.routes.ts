import { Router, type Request } from "express";
import { requireAuth, requirePermission } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/async-handler";
import {
  idParamSchema,
  quotationCodePreviewQuerySchema,
  quotationCreateSchema,
  quotationQuerySchema,
  quotationUpdateSchema
} from "./quotations.schemas";
import {
  createQuotation,
  deleteQuotation,
  getQuotation,
  listQuotations,
  previewNextQuotationCode,
  updateQuotation
} from "./quotations.service";

export const quotationsRouter = Router();

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

quotationsRouter.post(
  "/",
  requirePermission("quotations.manage"),
  asyncHandler(async (req, res) => {
    const body = quotationCreateSchema.parse(req.body);
    res.status(201).json({ status: "ok", data: await createQuotation(body, contextFromRequest(req)) });
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
