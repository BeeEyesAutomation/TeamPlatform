import { Router, type Request } from "express";
import { requireAuth, requirePermission } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/async-handler";
import {
  approveTask,
  closeIssue,
  confirmTask,
  createCost,
  createIssue,
  createMaterial,
  createMember,
  createPlan,
  createProject,
  createTask,
  deleteCost,
  deleteIssue,
  deleteMaterial,
  deleteMember,
  deletePlan,
  deleteProject,
  deleteTask,
  getIssue,
  getProject,
  getProjectDashboard,
  getProjectProfile,
  getProjectTimeline,
  getTask,
  listCosts,
  listIssues,
  listMaterials,
  listMembers,
  listPlans,
  listProjects,
  listTasks,
  reopenIssue,
  returnTask,
  submitTask,
  updateCost,
  updateIssue,
  updateMaterial,
  updateMember,
  updatePlan,
  updateProject,
  updateProjectProfile,
  updateTask,
  updateTaskProgress
} from "./projects.service";
import {
  costCreateSchema,
  costUpdateSchema,
  idParamSchema,
  issueCreateSchema,
  issueUpdateSchema,
  materialCreateSchema,
  materialUpdateSchema,
  memberCreateSchema,
  memberUpdateSchema,
  planCreateSchema,
  planUpdateSchema,
  projectCreateSchema,
  projectIdParamSchema,
  projectProfileUpdateSchema,
  projectQuerySchema,
  projectUpdateSchema,
  taskCreateSchema,
  taskProgressSchema,
  taskUpdateSchema
} from "./projects.schemas";

export const projectsRouter = Router();
export const projectPlansRouter = Router();
export const projectTasksRouter = Router();
export const projectIssuesRouter = Router();
export const projectMaterialsRouter = Router();
export const projectCostsRouter = Router();
export const projectMembersRouter = Router();

const contextFromRequest = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.header("user-agent")
});

projectsRouter.use(requireAuth);
projectPlansRouter.use(requireAuth, requirePermission("projects.manage"));
projectTasksRouter.use(requireAuth);
projectIssuesRouter.use(requireAuth);
projectMaterialsRouter.use(requireAuth, requirePermission("projects.manage"));
projectCostsRouter.use(requireAuth, requirePermission("projects.manage"));
projectMembersRouter.use(requireAuth, requirePermission("projects.manage"));

projectsRouter.get(
  "/",
  requirePermission("projects.view"),
  asyncHandler(async (req, res) => {
    const query = projectQuerySchema.parse(req.query);
    const data = await listProjects(query);
    res.json({ status: "ok", data });
  })
);

projectsRouter.post(
  "/",
  requirePermission("projects.manage"),
  asyncHandler(async (req, res) => {
    const body = projectCreateSchema.parse(req.body);
    const data = await createProject(body, contextFromRequest(req));
    res.status(201).json({ status: "ok", data });
  })
);

projectsRouter.get("/:id/dashboard", requirePermission("projects.view"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ status: "ok", data: await getProjectDashboard(id) });
}));

projectsRouter.get("/:id/profile", requirePermission("projects.view"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ status: "ok", data: await getProjectProfile(id) });
}));

projectsRouter.put("/:id/profile", requirePermission("projects.manage"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = projectProfileUpdateSchema.parse(req.body);
  res.json({ status: "ok", data: await updateProjectProfile(id, body, contextFromRequest(req)) });
}));

projectsRouter.get("/:id/timeline", requirePermission("projects.view"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ status: "ok", data: await getProjectTimeline(id) });
}));

projectsRouter.get("/:id", requirePermission("projects.view"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ status: "ok", data: await getProject(id) });
}));

projectsRouter.put("/:id", requirePermission("projects.manage"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = projectUpdateSchema.parse(req.body);
  res.json({ status: "ok", data: await updateProject(id, body, contextFromRequest(req)) });
}));

projectsRouter.delete("/:id", requirePermission("projects.manage"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ status: "ok", data: await deleteProject(id, contextFromRequest(req)) });
}));

projectsRouter.get("/:projectId/plans", requirePermission("projects.view"), asyncHandler(async (req, res) => {
  const { projectId } = projectIdParamSchema.parse(req.params);
  res.json({ status: "ok", data: await listPlans(projectId) });
}));

projectsRouter.post("/:projectId/plans", requirePermission("projects.manage"), asyncHandler(async (req, res) => {
  const { projectId } = projectIdParamSchema.parse(req.params);
  const body = planCreateSchema.parse(req.body);
  res.status(201).json({ status: "ok", data: await createPlan(projectId, body, contextFromRequest(req)) });
}));

projectsRouter.get("/:projectId/tasks", requirePermission("projects.view"), asyncHandler(async (req, res) => {
  const { projectId } = projectIdParamSchema.parse(req.params);
  res.json({ status: "ok", data: await listTasks(projectId) });
}));

projectsRouter.post("/:projectId/tasks", requirePermission("projects.manage"), asyncHandler(async (req, res) => {
  const { projectId } = projectIdParamSchema.parse(req.params);
  const body = taskCreateSchema.parse(req.body);
  res.status(201).json({ status: "ok", data: await createTask(projectId, body, contextFromRequest(req)) });
}));

projectsRouter.get("/:projectId/issues", requirePermission("projects.view"), asyncHandler(async (req, res) => {
  const { projectId } = projectIdParamSchema.parse(req.params);
  res.json({ status: "ok", data: await listIssues(projectId) });
}));

projectsRouter.post("/:projectId/issues", requirePermission("projects.manage"), asyncHandler(async (req, res) => {
  const { projectId } = projectIdParamSchema.parse(req.params);
  const body = issueCreateSchema.parse(req.body);
  res.status(201).json({ status: "ok", data: await createIssue(projectId, body, contextFromRequest(req)) });
}));

projectsRouter.get("/:projectId/materials", requirePermission("projects.view"), asyncHandler(async (req, res) => {
  const { projectId } = projectIdParamSchema.parse(req.params);
  res.json({ status: "ok", data: await listMaterials(projectId) });
}));

projectsRouter.post("/:projectId/materials", requirePermission("projects.manage"), asyncHandler(async (req, res) => {
  const { projectId } = projectIdParamSchema.parse(req.params);
  const body = materialCreateSchema.parse(req.body);
  res.status(201).json({ status: "ok", data: await createMaterial(projectId, body, contextFromRequest(req)) });
}));

projectsRouter.get("/:projectId/costs", requirePermission("projects.view"), asyncHandler(async (req, res) => {
  const { projectId } = projectIdParamSchema.parse(req.params);
  res.json({ status: "ok", data: await listCosts(projectId) });
}));

projectsRouter.post("/:projectId/costs", requirePermission("projects.manage"), asyncHandler(async (req, res) => {
  const { projectId } = projectIdParamSchema.parse(req.params);
  const body = costCreateSchema.parse(req.body);
  res.status(201).json({ status: "ok", data: await createCost(projectId, body, contextFromRequest(req)) });
}));

projectsRouter.get("/:projectId/members", requirePermission("projects.view"), asyncHandler(async (req, res) => {
  const { projectId } = projectIdParamSchema.parse(req.params);
  res.json({ status: "ok", data: await listMembers(projectId) });
}));

projectsRouter.post("/:projectId/members", requirePermission("projects.manage"), asyncHandler(async (req, res) => {
  const { projectId } = projectIdParamSchema.parse(req.params);
  const body = memberCreateSchema.parse(req.body);
  res.status(201).json({ status: "ok", data: await createMember(projectId, body, contextFromRequest(req)) });
}));

projectPlansRouter.put("/:id", asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = planUpdateSchema.parse(req.body);
  res.json({ status: "ok", data: await updatePlan(id, body, contextFromRequest(req)) });
}));
projectPlansRouter.delete("/:id", asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ status: "ok", data: await deletePlan(id, contextFromRequest(req)) });
}));

projectTasksRouter.get("/:id", requirePermission("projects.view"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ status: "ok", data: await getTask(id) });
}));
projectTasksRouter.put("/:id", requirePermission("projects.manage"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = taskUpdateSchema.parse(req.body);
  res.json({ status: "ok", data: await updateTask(id, body, contextFromRequest(req)) });
}));
projectTasksRouter.delete("/:id", requirePermission("projects.manage"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ status: "ok", data: await deleteTask(id, contextFromRequest(req)) });
}));
projectTasksRouter.post("/:id/confirm", requirePermission("projects.manage"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ status: "ok", data: await confirmTask(id, contextFromRequest(req)) });
}));
projectTasksRouter.post("/:id/progress", requirePermission("projects.manage"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = taskProgressSchema.parse(req.body);
  res.json({ status: "ok", data: await updateTaskProgress(id, body, contextFromRequest(req)) });
}));
projectTasksRouter.post("/:id/submit", requirePermission("projects.manage"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ status: "ok", data: await submitTask(id, contextFromRequest(req)) });
}));
projectTasksRouter.post("/:id/approve", requirePermission("projects.manage"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ status: "ok", data: await approveTask(id, contextFromRequest(req)) });
}));
projectTasksRouter.post("/:id/return", requirePermission("projects.manage"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ status: "ok", data: await returnTask(id, contextFromRequest(req)) });
}));

projectIssuesRouter.get("/:id", requirePermission("projects.view"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ status: "ok", data: await getIssue(id) });
}));
projectIssuesRouter.put("/:id", requirePermission("projects.manage"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = issueUpdateSchema.parse(req.body);
  res.json({ status: "ok", data: await updateIssue(id, body, contextFromRequest(req)) });
}));
projectIssuesRouter.delete("/:id", requirePermission("projects.manage"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ status: "ok", data: await deleteIssue(id, contextFromRequest(req)) });
}));
projectIssuesRouter.post("/:id/close", requirePermission("projects.manage"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ status: "ok", data: await closeIssue(id, contextFromRequest(req)) });
}));
projectIssuesRouter.post("/:id/reopen", requirePermission("projects.manage"), asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ status: "ok", data: await reopenIssue(id, contextFromRequest(req)) });
}));

projectMaterialsRouter.put("/:id", asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = materialUpdateSchema.parse(req.body);
  res.json({ status: "ok", data: await updateMaterial(id, body, contextFromRequest(req)) });
}));
projectMaterialsRouter.delete("/:id", asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ status: "ok", data: await deleteMaterial(id, contextFromRequest(req)) });
}));

projectCostsRouter.put("/:id", asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = costUpdateSchema.parse(req.body);
  res.json({ status: "ok", data: await updateCost(id, body, contextFromRequest(req)) });
}));
projectCostsRouter.delete("/:id", asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ status: "ok", data: await deleteCost(id, contextFromRequest(req)) });
}));

projectMembersRouter.put("/:id", asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = memberUpdateSchema.parse(req.body);
  res.json({ status: "ok", data: await updateMember(id, body, contextFromRequest(req)) });
}));
projectMembersRouter.delete("/:id", asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ status: "ok", data: await deleteMember(id, contextFromRequest(req)) });
}));
