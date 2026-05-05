import { Router } from "express";
import { requireAuth, requirePermission } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/async-handler";
import { employeeCreateSchema, employeeQuerySchema, employeeUpdateSchema, idParamSchema } from "../hr/hr.schemas";
import { createEmployee, deactivateEmployee, getEmployee, getEmployees, getSalaryPreview, updateEmployee } from "./employees.service";

export const employeesRouter = Router();

employeesRouter.use(requireAuth);

employeesRouter.get(
  "/",
  requirePermission("employees.view"),
  asyncHandler(async (req, res) => {
    const query = employeeQuerySchema.parse(req.query);
    const data = await getEmployees(query, {
      user: req.user
    });
    res.json({ status: "ok", data });
  })
);

employeesRouter.post(
  "/",
  requirePermission("employees.manage"),
  asyncHandler(async (req, res) => {
    const body = employeeCreateSchema.parse(req.body);
    const data = await createEmployee(body, {
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.header("user-agent")
    });
    res.status(201).json({ status: "ok", data });
  })
);

employeesRouter.get(
  "/:id",
  requirePermission("employees.view"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = await getEmployee(id, {
      user: req.user
    });
    res.json({ status: "ok", data });
  })
);

employeesRouter.put(
  "/:id",
  requirePermission("employees.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = employeeUpdateSchema.parse(req.body);
    const data = await updateEmployee(id, body, {
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.header("user-agent")
    });
    res.json({ status: "ok", data });
  })
);

employeesRouter.delete(
  "/:id",
  requirePermission("employees.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = await deactivateEmployee(id, {
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.header("user-agent")
    });
    res.json({ status: "ok", data });
  })
);

employeesRouter.get(
  "/:id/salary-preview",
  requirePermission("employees.view"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = await getSalaryPreview(id, {
      user: req.user
    });
    res.json({ status: "ok", data });
  })
);
