import { Router } from "express";
import type { Request } from "express";
import { requireAuth, requirePermission } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/async-handler";
import { allowanceTypeCreateSchema, allowanceTypeQuerySchema, allowanceTypeUpdateSchema, idParamSchema } from "./allowances.schemas";
import {
  createAllowanceType,
  deactivateAllowanceType,
  getAllowanceType,
  listAllowanceTypes,
  updateAllowanceType
} from "./allowances.service";

export const allowancesRouter = Router();

allowancesRouter.use(requireAuth, requirePermission("payroll.configure"));

const contextFromRequest = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.header("user-agent")
});

allowancesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = allowanceTypeQuerySchema.parse(req.query);
    const data = await listAllowanceTypes(query);
    res.json({ status: "ok", data });
  })
);

allowancesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = allowanceTypeCreateSchema.parse(req.body);
    const data = await createAllowanceType(body, contextFromRequest(req));
    res.status(201).json({ status: "ok", data });
  })
);

allowancesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = await getAllowanceType(id);
    res.json({ status: "ok", data });
  })
);

allowancesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = allowanceTypeUpdateSchema.parse(req.body);
    const data = await updateAllowanceType(id, body, contextFromRequest(req));
    res.json({ status: "ok", data });
  })
);

allowancesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = await deactivateAllowanceType(id, contextFromRequest(req));
    res.json({ status: "ok", data });
  })
);
