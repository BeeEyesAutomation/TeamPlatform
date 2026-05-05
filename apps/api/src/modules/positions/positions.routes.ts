import { Router } from "express";
import { requireAuth, requirePermission } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/async-handler";
import { idParamSchema, positionCreateSchema, positionQuerySchema, positionUpdateSchema } from "../hr/hr.schemas";
import { createPosition, deactivatePosition, getPosition, getPositions, updatePosition } from "./positions.service";

export const positionsRouter = Router();

positionsRouter.use(requireAuth);

positionsRouter.get(
  "/",
  requirePermission("employees.view"),
  asyncHandler(async (req, res) => {
    const query = positionQuerySchema.parse(req.query);
    const data = await getPositions(query);
    res.json({ status: "ok", data });
  })
);

positionsRouter.post(
  "/",
  requirePermission("employees.manage"),
  asyncHandler(async (req, res) => {
    const body = positionCreateSchema.parse(req.body);
    const data = await createPosition(body, {
      actorId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.header("user-agent")
    });
    res.status(201).json({ status: "ok", data });
  })
);

positionsRouter.get(
  "/:id",
  requirePermission("employees.view"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = await getPosition(id);
    res.json({ status: "ok", data });
  })
);

positionsRouter.put(
  "/:id",
  requirePermission("employees.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = positionUpdateSchema.parse(req.body);
    const data = await updatePosition(id, body, {
      actorId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.header("user-agent")
    });
    res.json({ status: "ok", data });
  })
);

positionsRouter.delete(
  "/:id",
  requirePermission("employees.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = await deactivatePosition(id, {
      actorId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.header("user-agent")
    });
    res.json({ status: "ok", data });
  })
);
