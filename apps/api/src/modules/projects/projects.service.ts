import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { AppError } from "../../utils/app-error";
import { createAuditLog } from "../audit/audit.service";
import { getPagination, getPaginationMeta, handlePrismaError } from "../hr/hr.utils";
import type { z } from "zod";
import type {
  costCreateSchema,
  costUpdateSchema,
  issueCreateSchema,
  issueUpdateSchema,
  materialCreateSchema,
  materialUpdateSchema,
  memberCreateSchema,
  memberUpdateSchema,
  planCreateSchema,
  planUpdateSchema,
  projectCreateSchema,
  projectProfileUpdateSchema,
  projectQuerySchema,
  projectUpdateSchema,
  taskCreateSchema,
  taskProgressSchema,
  taskUpdateSchema
} from "./projects.schemas";

type ProjectQuery = z.infer<typeof projectQuerySchema>;
type ProjectCreate = z.infer<typeof projectCreateSchema>;
type ProjectUpdate = z.infer<typeof projectUpdateSchema>;
type ProjectProfileUpdate = z.infer<typeof projectProfileUpdateSchema>;
type PlanCreate = z.infer<typeof planCreateSchema>;
type PlanUpdate = z.infer<typeof planUpdateSchema>;
type TaskCreate = z.infer<typeof taskCreateSchema>;
type TaskUpdate = z.infer<typeof taskUpdateSchema>;
type TaskProgress = z.infer<typeof taskProgressSchema>;
type IssueCreate = z.infer<typeof issueCreateSchema>;
type IssueUpdate = z.infer<typeof issueUpdateSchema>;
type MaterialCreate = z.infer<typeof materialCreateSchema>;
type MaterialUpdate = z.infer<typeof materialUpdateSchema>;
type CostCreate = z.infer<typeof costCreateSchema>;
type CostUpdate = z.infer<typeof costUpdateSchema>;
type MemberCreate = z.infer<typeof memberCreateSchema>;
type MemberUpdate = z.infer<typeof memberUpdateSchema>;

interface RequestContext {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
}

const projectInclude = {
  members: {
    include: {
      employee: {
        select: {
          id: true,
          employeeCode: true,
          fullName: true
        }
      }
    },
    orderBy: {
      createdAt: "asc" as const
    }
  },
  plans: {
    orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }]
  }
};

const memberInclude = {
  employee: {
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      email: true
    }
  }
};

function decimalValue(value: string | number | undefined) {
  return value === undefined ? undefined : new Prisma.Decimal(value);
}

function projectData(data: ProjectCreate | ProjectUpdate): Prisma.ProjectUncheckedCreateInput | Prisma.ProjectUncheckedUpdateInput {
  return {
    ...data,
    progressPercent: decimalValue(data.progressPercent),
    budgetEstimated: decimalValue(data.budgetEstimated),
    budgetActual: decimalValue(data.budgetActual)
  };
}

function planData(data: PlanCreate | PlanUpdate): Prisma.ProjectPlanUncheckedCreateInput | Prisma.ProjectPlanUncheckedUpdateInput {
  return {
    ...data,
    progressPercent: decimalValue(data.progressPercent)
  };
}

function taskData(data: TaskCreate | TaskUpdate): Prisma.ProjectTaskUncheckedCreateInput | Prisma.ProjectTaskUncheckedUpdateInput {
  return {
    ...data,
    progressPercent: decimalValue(data.progressPercent)
  };
}

function materialData(data: MaterialCreate | MaterialUpdate): Prisma.ProjectMaterialUncheckedCreateInput | Prisma.ProjectMaterialUncheckedUpdateInput {
  const plannedQuantity = decimalValue(data.plannedQuantity);
  const usedQuantity = decimalValue(data.usedQuantity);
  const remainingQuantity = data.remainingQuantity === undefined && plannedQuantity
    ? plannedQuantity.minus(usedQuantity ?? 0)
    : decimalValue(data.remainingQuantity);

  return {
    ...data,
    plannedQuantity,
    usedQuantity,
    remainingQuantity,
    estimatedUnitPrice: decimalValue(data.estimatedUnitPrice),
    actualUnitPrice: decimalValue(data.actualUnitPrice)
  };
}

function costData(data: CostCreate | CostUpdate): Prisma.ProjectCostUncheckedCreateInput | Prisma.ProjectCostUncheckedUpdateInput {
  return {
    ...data,
    amount: decimalValue(data.amount)
  };
}

async function auditProjectChange(input: {
  action: string;
  projectId: string;
  targetType: string;
  targetId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  context: RequestContext;
}) {
  await createAuditLog({
    actorId: input.context.actorId,
    action: input.action,
    module: "projects",
    targetType: input.targetType,
    targetId: input.targetId ?? input.projectId,
    oldValue: input.oldValue,
    newValue: input.newValue,
    metadata: { projectId: input.projectId },
    ipAddress: input.context.ipAddress,
    userAgent: input.context.userAgent
  });
}

async function ensureProject(id: string) {
  const project = await prisma.project.findFirst({
    where: {
      id,
      deletedAt: null
    },
    include: projectInclude
  });

  if (!project) {
    throw new AppError(404, "Project not found");
  }

  return project;
}

export async function listProjects(query: ProjectQuery) {
  const pagination = getPagination(query);
  const where = {
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { projectCode: { contains: query.search, mode: "insensitive" as const } },
            { name: { contains: query.search, mode: "insensitive" as const } },
            { customerName: { contains: query.search, mode: "insensitive" as const } }
          ]
        }
      : {})
  };
  const [total, items] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      include: {
        _count: {
          select: {
            tasks: true,
            issues: true,
            members: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      ...pagination
    })
  ]);

  return {
    items,
    meta: getPaginationMeta(query, total)
  };
}

export function getProject(id: string) {
  return ensureProject(id);
}

export function getProjectProfile(id: string) {
  return ensureProject(id);
}

export async function createProject(data: ProjectCreate, context: RequestContext) {
  try {
    const project = await prisma.project.create({
      data: projectData(data) as Prisma.ProjectUncheckedCreateInput,
      include: projectInclude
    });

    await auditProjectChange({
      action: "create",
      projectId: project.id,
      targetType: "project",
      newValue: project,
      context
    });

    return project;
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function updateProject(id: string, data: ProjectUpdate, context: RequestContext) {
  const existing = await ensureProject(id);
  try {
    const project = await prisma.project.update({
      where: { id },
      data: projectData(data) as Prisma.ProjectUncheckedUpdateInput,
      include: projectInclude
    });

    await auditProjectChange({
      action: "update",
      projectId: id,
      targetType: "project",
      oldValue: existing,
      newValue: project,
      context
    });

    return project;
  } catch (error) {
    handlePrismaError(error);
  }
}

export function updateProjectProfile(id: string, data: ProjectProfileUpdate, context: RequestContext) {
  return updateProject(id, data, context);
}

export async function deleteProject(id: string, context: RequestContext) {
  const existing = await ensureProject(id);
  const project = await prisma.project.update({
    where: { id },
    data: {
      status: "cancelled",
      deletedAt: new Date()
    },
    include: projectInclude
  });

  await auditProjectChange({
    action: "delete",
    projectId: id,
    targetType: "project",
    oldValue: existing,
    newValue: project,
    context
  });

  return project;
}

export async function getProjectDashboard(projectId: string) {
  await ensureProject(projectId);
  const [projectsByStatus, tasksByStatus, issuesByStatus, materialsByStatus, costs, materials, project] = await Promise.all([
    prisma.project.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true }
    }),
    prisma.projectTask.groupBy({
      by: ["status"],
      where: { projectId },
      _count: { _all: true },
      _avg: { progressPercent: true }
    }),
    prisma.projectIssue.groupBy({
      by: ["status"],
      where: { projectId },
      _count: { _all: true }
    }),
    prisma.projectMaterial.groupBy({
      by: ["status"],
      where: { projectId },
      _count: { _all: true }
    }),
    prisma.projectCost.aggregate({
      where: { projectId },
      _sum: { amount: true }
    }),
    prisma.projectMaterial.findMany({ where: { projectId } }),
    prisma.project.findUniqueOrThrow({ where: { id: projectId } })
  ]);

  const estimatedMaterials = materials.reduce((total, material) => {
    const price = material.estimatedUnitPrice ?? new Prisma.Decimal(0);
    return total.plus(material.plannedQuantity.mul(price));
  }, new Prisma.Decimal(0));
  const actualMaterials = materials.reduce((total, material) => {
    const price = material.actualUnitPrice ?? new Prisma.Decimal(0);
    return total.plus(material.usedQuantity.mul(price));
  }, new Prisma.Decimal(0));
  const totalTasks = tasksByStatus.reduce((total, row) => total + row._count._all, 0);
  const completedTasks = tasksByStatus.find((row) => row.status === "completed")?._count._all ?? 0;
  const openIssues = issuesByStatus
    .filter((row) => row.status !== "closed" && row.status !== "resolved")
    .reduce((total, row) => total + row._count._all, 0);

  return {
    projectId,
    projectStatusCounts: projectsByStatus.map((row) => ({ status: row.status, count: row._count._all })),
    progressSummary: {
      projectProgressPercent: project.progressPercent,
      averageTaskProgressPercent: totalTasks === 0
        ? new Prisma.Decimal(0)
        : tasksByStatus.reduce((total, row) => total.plus((row._avg.progressPercent ?? new Prisma.Decimal(0)).mul(row._count._all)), new Prisma.Decimal(0)).div(totalTasks)
    },
    taskSummary: {
      total: totalTasks,
      completed: completedTasks,
      byStatus: tasksByStatus.map((row) => ({ status: row.status, count: row._count._all }))
    },
    issueSummary: {
      open: openIssues,
      byStatus: issuesByStatus.map((row) => ({ status: row.status, count: row._count._all }))
    },
    materialSummary: {
      estimatedCost: estimatedMaterials,
      actualCost: actualMaterials,
      byStatus: materialsByStatus.map((row) => ({ status: row.status, count: row._count._all }))
    },
    costSummary: {
      estimated: project.budgetEstimated ?? estimatedMaterials,
      actual: costs._sum.amount ?? project.budgetActual ?? actualMaterials,
      variance: (costs._sum.amount ?? project.budgetActual ?? actualMaterials).minus(project.budgetEstimated ?? estimatedMaterials)
    }
  };
}

export function listPlans(projectId: string) {
  return prisma.projectPlan.findMany({
    where: { projectId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
}

export async function createPlan(projectId: string, data: PlanCreate, context: RequestContext) {
  await ensureProject(projectId);
  const plan = await prisma.projectPlan.create({
    data: { projectId, ...planData(data) } as Prisma.ProjectPlanUncheckedCreateInput
  });
  await auditProjectChange({ action: "create_plan", projectId, targetType: "project_plan", targetId: plan.id, newValue: plan, context });
  return plan;
}

export async function updatePlan(id: string, data: PlanUpdate, context: RequestContext) {
  const existing = await prisma.projectPlan.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Project plan not found");
  const plan = await prisma.projectPlan.update({ where: { id }, data: planData(data) as Prisma.ProjectPlanUncheckedUpdateInput });
  await auditProjectChange({ action: "update_plan", projectId: existing.projectId, targetType: "project_plan", targetId: id, oldValue: existing, newValue: plan, context });
  return plan;
}

export async function deletePlan(id: string, context: RequestContext) {
  const existing = await prisma.projectPlan.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Project plan not found");
  const plan = await prisma.projectPlan.update({ where: { id }, data: { status: "cancelled" } });
  await auditProjectChange({ action: "delete_plan", projectId: existing.projectId, targetType: "project_plan", targetId: id, oldValue: existing, newValue: plan, context });
  return plan;
}

export function listTasks(projectId: string) {
  return prisma.projectTask.findMany({
    where: { projectId },
    orderBy: [{ status: "asc" }, { deadline: "asc" }, { createdAt: "desc" }]
  });
}

export async function getTask(id: string) {
  const task = await prisma.projectTask.findUnique({ where: { id } });
  if (!task) throw new AppError(404, "Project task not found");
  return task;
}

export async function createTask(projectId: string, data: TaskCreate, context: RequestContext) {
  await ensureProject(projectId);
  const task = await prisma.projectTask.create({
    data: { projectId, assignedById: context.actorId, ...taskData(data) } as Prisma.ProjectTaskUncheckedCreateInput
  });
  await auditProjectChange({ action: "create_task", projectId, targetType: "project_task", targetId: task.id, newValue: task, context });
  return task;
}

export async function updateTask(id: string, data: TaskUpdate, context: RequestContext) {
  const existing = await getTask(id);
  const task = await prisma.projectTask.update({ where: { id }, data: taskData(data) as Prisma.ProjectTaskUncheckedUpdateInput });
  await auditProjectChange({ action: "update_task", projectId: existing.projectId, targetType: "project_task", targetId: id, oldValue: existing, newValue: task, context });
  return task;
}

export async function deleteTask(id: string, context: RequestContext) {
  const existing = await getTask(id);
  const task = await prisma.projectTask.update({ where: { id }, data: { status: "cancelled" } });
  await auditProjectChange({ action: "delete_task", projectId: existing.projectId, targetType: "project_task", targetId: id, oldValue: existing, newValue: task, context });
  return task;
}

export async function confirmTask(id: string, context: RequestContext) {
  const existing = await getTask(id);
  const task = await prisma.projectTask.update({ where: { id }, data: { status: "confirmed", confirmedAt: new Date() } });
  await auditProjectChange({ action: "confirm_task", projectId: existing.projectId, targetType: "project_task", targetId: id, oldValue: existing, newValue: task, context });
  return task;
}

export async function updateTaskProgress(id: string, data: TaskProgress, context: RequestContext) {
  const existing = await getTask(id);
  const task = await prisma.projectTask.update({
    where: { id },
    data: {
      progressPercent: new Prisma.Decimal(data.progressPercent),
      status: data.progressPercent >= 100 ? "pending_review" : "in_progress",
      metadata: data.note ? { progressNote: data.note } : existing.metadata as Prisma.InputJsonValue
    }
  });
  await auditProjectChange({ action: "update_task_progress", projectId: existing.projectId, targetType: "project_task", targetId: id, oldValue: existing, newValue: task, context });
  return task;
}

export async function submitTask(id: string, context: RequestContext) {
  const existing = await getTask(id);
  const task = await prisma.projectTask.update({ where: { id }, data: { status: "pending_review", submittedAt: new Date() } });
  await auditProjectChange({ action: "submit_task", projectId: existing.projectId, targetType: "project_task", targetId: id, oldValue: existing, newValue: task, context });
  return task;
}

export async function approveTask(id: string, context: RequestContext) {
  const existing = await getTask(id);
  const task = await prisma.projectTask.update({ where: { id }, data: { status: "completed", progressPercent: new Prisma.Decimal(100), completedAt: new Date() } });
  await auditProjectChange({ action: "approve_task", projectId: existing.projectId, targetType: "project_task", targetId: id, oldValue: existing, newValue: task, context });
  return task;
}

export async function returnTask(id: string, context: RequestContext) {
  const existing = await getTask(id);
  const task = await prisma.projectTask.update({ where: { id }, data: { status: "in_progress" } });
  await auditProjectChange({ action: "return_task", projectId: existing.projectId, targetType: "project_task", targetId: id, oldValue: existing, newValue: task, context });
  return task;
}

export function listIssues(projectId: string) {
  return prisma.projectIssue.findMany({
    where: { projectId },
    orderBy: [{ status: "asc" }, { deadline: "asc" }, { createdAt: "desc" }]
  });
}

export async function getIssue(id: string) {
  const issue = await prisma.projectIssue.findUnique({ where: { id } });
  if (!issue) throw new AppError(404, "Project issue not found");
  return issue;
}

export async function createIssue(projectId: string, data: IssueCreate, context: RequestContext) {
  await ensureProject(projectId);
  const issue = await prisma.projectIssue.create({
    data: { projectId, reportedById: context.actorId, ...data } as Prisma.ProjectIssueUncheckedCreateInput
  });
  await auditProjectChange({ action: "create_issue", projectId, targetType: "project_issue", targetId: issue.id, newValue: issue, context });
  return issue;
}

export async function updateIssue(id: string, data: IssueUpdate, context: RequestContext) {
  const existing = await getIssue(id);
  const issue = await prisma.projectIssue.update({ where: { id }, data });
  await auditProjectChange({ action: "update_issue", projectId: existing.projectId, targetType: "project_issue", targetId: id, oldValue: existing, newValue: issue, context });
  return issue;
}

export async function deleteIssue(id: string, context: RequestContext) {
  const existing = await getIssue(id);
  const issue = await prisma.projectIssue.update({ where: { id }, data: { status: "closed", closedAt: new Date() } });
  await auditProjectChange({ action: "delete_issue", projectId: existing.projectId, targetType: "project_issue", targetId: id, oldValue: existing, newValue: issue, context });
  return issue;
}

export async function closeIssue(id: string, context: RequestContext) {
  const existing = await getIssue(id);
  const issue = await prisma.projectIssue.update({ where: { id }, data: { status: "closed", closedAt: new Date() } });
  await auditProjectChange({ action: "close_issue", projectId: existing.projectId, targetType: "project_issue", targetId: id, oldValue: existing, newValue: issue, context });
  return issue;
}

export async function reopenIssue(id: string, context: RequestContext) {
  const existing = await getIssue(id);
  const issue = await prisma.projectIssue.update({ where: { id }, data: { status: "in_progress", closedAt: null } });
  await auditProjectChange({ action: "reopen_issue", projectId: existing.projectId, targetType: "project_issue", targetId: id, oldValue: existing, newValue: issue, context });
  return issue;
}

export function listMaterials(projectId: string) {
  return prisma.projectMaterial.findMany({ where: { projectId }, orderBy: [{ status: "asc" }, { materialName: "asc" }] });
}

export async function createMaterial(projectId: string, data: MaterialCreate, context: RequestContext) {
  await ensureProject(projectId);
  const material = await prisma.projectMaterial.create({
    data: { projectId, ...materialData(data) } as Prisma.ProjectMaterialUncheckedCreateInput
  });
  await auditProjectChange({ action: "create_material", projectId, targetType: "project_material", targetId: material.id, newValue: material, context });
  return material;
}

export async function updateMaterial(id: string, data: MaterialUpdate, context: RequestContext) {
  const existing = await prisma.projectMaterial.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Project material not found");
  const material = await prisma.projectMaterial.update({ where: { id }, data: materialData(data) as Prisma.ProjectMaterialUncheckedUpdateInput });
  await auditProjectChange({ action: "update_material", projectId: existing.projectId, targetType: "project_material", targetId: id, oldValue: existing, newValue: material, context });
  return material;
}

export async function deleteMaterial(id: string, context: RequestContext) {
  const existing = await prisma.projectMaterial.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Project material not found");
  const material = await prisma.projectMaterial.update({ where: { id }, data: { status: "cancelled" } });
  await auditProjectChange({ action: "delete_material", projectId: existing.projectId, targetType: "project_material", targetId: id, oldValue: existing, newValue: material, context });
  return material;
}

export function listCosts(projectId: string) {
  return prisma.projectCost.findMany({ where: { projectId }, orderBy: [{ costDate: "desc" }, { createdAt: "desc" }] });
}

export async function createCost(projectId: string, data: CostCreate, context: RequestContext) {
  await ensureProject(projectId);
  const cost = await prisma.projectCost.create({
    data: { projectId, createdById: context.actorId, ...costData(data) } as Prisma.ProjectCostUncheckedCreateInput
  });
  await auditProjectChange({ action: "create_cost", projectId, targetType: "project_cost", targetId: cost.id, newValue: cost, context });
  return cost;
}

export async function updateCost(id: string, data: CostUpdate, context: RequestContext) {
  const existing = await prisma.projectCost.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Project cost not found");
  const cost = await prisma.projectCost.update({ where: { id }, data: costData(data) as Prisma.ProjectCostUncheckedUpdateInput });
  await auditProjectChange({ action: "update_cost", projectId: existing.projectId, targetType: "project_cost", targetId: id, oldValue: existing, newValue: cost, context });
  return cost;
}

export async function deleteCost(id: string, context: RequestContext) {
  const existing = await prisma.projectCost.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Project cost not found");
  const cost = await prisma.projectCost.delete({ where: { id } });
  await auditProjectChange({ action: "delete_cost", projectId: existing.projectId, targetType: "project_cost", targetId: id, oldValue: existing, newValue: cost, context });
  return cost;
}

export function listMembers(projectId: string) {
  return prisma.projectMember.findMany({ where: { projectId }, include: memberInclude, orderBy: [{ status: "asc" }, { createdAt: "asc" }] });
}

export async function createMember(projectId: string, data: MemberCreate, context: RequestContext) {
  await ensureProject(projectId);
  const member = await prisma.projectMember.upsert({
    where: { projectId_employeeId: { projectId, employeeId: data.employeeId } },
    update: data,
    create: { projectId, ...data },
    include: memberInclude
  });
  await auditProjectChange({ action: "upsert_member", projectId, targetType: "project_member", targetId: member.id, newValue: member, context });
  return member;
}

export async function updateMember(id: string, data: MemberUpdate, context: RequestContext) {
  const existing = await prisma.projectMember.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Project member not found");
  const member = await prisma.projectMember.update({ where: { id }, data, include: memberInclude });
  await auditProjectChange({ action: "update_member", projectId: existing.projectId, targetType: "project_member", targetId: id, oldValue: existing, newValue: member, context });
  return member;
}

export async function deleteMember(id: string, context: RequestContext) {
  const existing = await prisma.projectMember.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Project member not found");
  const member = await prisma.projectMember.update({ where: { id }, data: { status: "inactive", leftDate: new Date() }, include: memberInclude });
  await auditProjectChange({ action: "delete_member", projectId: existing.projectId, targetType: "project_member", targetId: id, oldValue: existing, newValue: member, context });
  return member;
}

export async function getProjectTimeline(projectId: string) {
  await ensureProject(projectId);
  const logs = await prisma.auditLog.findMany({
    where: {
      module: "projects",
      OR: [
        { targetId: projectId },
        { metadata: { path: ["projectId"], equals: projectId } }
      ]
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return logs;
}
