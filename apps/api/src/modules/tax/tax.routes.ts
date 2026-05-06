import { Router } from "express";
import type { Request } from "express";
import { requireAuth, requirePermission } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/async-handler";
import {
  idParamSchema,
  taxBracketCreateSchema,
  taxBracketQuerySchema,
  taxBracketUpdateSchema,
  taxSettingCreateSchema,
  taxSettingQuerySchema,
  taxSettingUpdateSchema
} from "./tax.schemas";
import {
  activateTaxSetting,
  createTaxBracket,
  createTaxSetting,
  deleteTaxBracket,
  getTaxBracket,
  getTaxSetting,
  listTaxBrackets,
  listTaxSettings,
  updateTaxBracket,
  updateTaxSetting
} from "./tax.service";

export const taxRouter = Router();
export const taxBracketsRouter = Router();

taxRouter.use(requireAuth, requirePermission("payroll.configure"));
taxBracketsRouter.use(requireAuth, requirePermission("payroll.configure"));

const contextFromRequest = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.header("user-agent")
});

taxRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = taxSettingQuerySchema.parse(req.query);
    const data = await listTaxSettings(query);
    res.json({ status: "ok", data });
  })
);

taxRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = taxSettingCreateSchema.parse(req.body);
    const data = await createTaxSetting(body, contextFromRequest(req));
    res.status(201).json({ status: "ok", data });
  })
);

taxRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = await getTaxSetting(id);
    res.json({ status: "ok", data });
  })
);

taxRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = taxSettingUpdateSchema.parse(req.body);
    const data = await updateTaxSetting(id, body, contextFromRequest(req));
    res.json({ status: "ok", data });
  })
);

taxRouter.post(
  "/:id/activate",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = await activateTaxSetting(id, contextFromRequest(req));
    res.json({ status: "ok", data });
  })
);

taxRouter.get(
  "/:id/brackets",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const query = taxBracketQuerySchema.parse({ ...req.query, taxSettingId: id });
    const data = await listTaxBrackets(query);
    res.json({ status: "ok", data });
  })
);

taxRouter.post(
  "/:id/brackets",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = taxBracketCreateSchema.parse({ ...req.body, taxSettingId: id });
    const data = await createTaxBracket(body, contextFromRequest(req));
    res.status(201).json({ status: "ok", data });
  })
);

taxBracketsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = taxBracketQuerySchema.parse(req.query);
    const data = await listTaxBrackets(query);
    res.json({ status: "ok", data });
  })
);

taxBracketsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = taxBracketCreateSchema.parse(req.body);
    const data = await createTaxBracket(body, contextFromRequest(req));
    res.status(201).json({ status: "ok", data });
  })
);

taxBracketsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = await getTaxBracket(id);
    res.json({ status: "ok", data });
  })
);

taxBracketsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = taxBracketUpdateSchema.parse(req.body);
    const data = await updateTaxBracket(id, body, contextFromRequest(req));
    res.json({ status: "ok", data });
  })
);

taxBracketsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = await deleteTaxBracket(id, contextFromRequest(req));
    res.json({ status: "ok", data });
  })
);
