import { Router } from "express";
import { requireAuth, requirePermission } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/async-handler";
import {
  getHrOverview,
  getPayrollOverview,
  getProjectCosts,
  getProjectDetailStatistics,
  getProjectEmployees,
  getProjectIssues,
  getProjectMaterials,
  getProjectOverview,
  getProjectProgress,
  getProjectStatus
} from "./statistics.service";
import { z } from "zod";

export const statisticsRouter = Router();

statisticsRouter.use(requireAuth);

statisticsRouter.get("/hr/overview", requirePermission("employees.view"), asyncHandler(async (_req, res) => {
  res.json({ status: "ok", data: await getHrOverview() });
}));

statisticsRouter.get("/payroll/overview", requirePermission("payroll.view"), asyncHandler(async (req, res) => {
  const query = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/).optional() }).parse(req.query);
  res.json({ status: "ok", data: await getPayrollOverview(query.month) });
}));

statisticsRouter.get("/projects/overview", requirePermission("projects.view"), asyncHandler(async (_req, res) => {
  res.json({ status: "ok", data: await getProjectOverview() });
}));

statisticsRouter.get("/projects/status", requirePermission("projects.view"), asyncHandler(async (_req, res) => {
  res.json({ status: "ok", data: await getProjectStatus() });
}));

statisticsRouter.get("/projects/progress", requirePermission("projects.view"), asyncHandler(async (_req, res) => {
  res.json({ status: "ok", data: await getProjectProgress() });
}));

statisticsRouter.get("/projects/costs", requirePermission("projects.view"), asyncHandler(async (_req, res) => {
  res.json({ status: "ok", data: await getProjectCosts() });
}));

statisticsRouter.get("/projects/issues", requirePermission("projects.view"), asyncHandler(async (_req, res) => {
  res.json({ status: "ok", data: await getProjectIssues() });
}));

statisticsRouter.get("/projects/materials", requirePermission("projects.view"), asyncHandler(async (_req, res) => {
  res.json({ status: "ok", data: await getProjectMaterials() });
}));

statisticsRouter.get("/projects/employees", requirePermission("projects.view"), asyncHandler(async (_req, res) => {
  res.json({ status: "ok", data: await getProjectEmployees() });
}));

statisticsRouter.get("/projects/:id", requirePermission("projects.view"), asyncHandler(async (req, res) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  res.json({ status: "ok", data: await getProjectDetailStatistics(id) });
}));
