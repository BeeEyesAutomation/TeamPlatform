import { Router } from "express";
import { requireAuth, requirePermission } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/async-handler";
import { departmentCreateSchema, departmentQuerySchema, departmentUpdateSchema, idParamSchema } from "../hr/hr.schemas";
import { createDepartment, deactivateDepartment, getDepartment, getDepartments, updateDepartment } from "./departments.service";

export const departmentsRouter = Router();

departmentsRouter.use(requireAuth);

departmentsRouter.get(
  "/",
  requirePermission("employees.view"),
  asyncHandler(async (req, res) => {
    const query = departmentQuerySchema.parse(req.query);
    const data = await getDepartments(query);
    res.json({ status: "ok", data });
  })
);

departmentsRouter.post(
  "/",
  requirePermission("employees.manage"),
  asyncHandler(async (req, res) => {
    const body = departmentCreateSchema.parse(req.body);
    const data = await createDepartment(body, {
      actorId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.header("user-agent")
    });
    res.status(201).json({ status: "ok", data });
  })
);

departmentsRouter.get(
  "/:id",
  requirePermission("employees.view"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = await getDepartment(id);
    res.json({ status: "ok", data });
  })
);

departmentsRouter.put(
  "/:id",
  requirePermission("employees.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = departmentUpdateSchema.parse(req.body);
    const data = await updateDepartment(id, body, {
      actorId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.header("user-agent")
    });
    res.json({ status: "ok", data });
  })
);

departmentsRouter.delete(
  "/:id",
  requirePermission("employees.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = await deactivateDepartment(id, {
      actorId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.header("user-agent")
    });
    res.json({ status: "ok", data });
  })
);
