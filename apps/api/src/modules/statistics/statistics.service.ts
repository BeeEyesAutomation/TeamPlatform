import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client";

export async function getHrOverview() {
  const [employees, departments, positions] = await Promise.all([
    prisma.employee.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.department.count({ where: { deletedAt: null } }),
    prisma.position.count({ where: { deletedAt: null } })
  ]);
  return {
    employeesByStatus: employees.map((row) => ({ status: row.status, count: row._count._all })),
    departmentCount: departments,
    positionCount: positions
  };
}

export async function getPayrollOverview(month?: string) {
  const where = month ? { month } : {};
  const [byStatus, totals] = await Promise.all([
    prisma.payroll.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.payroll.aggregate({ where, _sum: { netSalary: true, personalIncomeTax: true } })
  ]);
  return {
    payrollsByStatus: byStatus.map((row) => ({ status: row.status, count: row._count._all })),
    totalNetSalary: totals._sum.netSalary ?? new Prisma.Decimal(0),
    totalTax: totals._sum.personalIncomeTax ?? new Prisma.Decimal(0)
  };
}

export async function getProjectStatus() {
  const rows = await prisma.project.groupBy({ by: ["status"], where: { deletedAt: null }, _count: { _all: true } });
  return rows.map((row) => ({ status: row.status, count: row._count._all }));
}

export async function getProjectProgress() {
  const rows = await prisma.project.findMany({ where: { deletedAt: null }, orderBy: { progressPercent: "desc" } });
  return rows.map((row) => ({ id: row.id, projectCode: row.projectCode, name: row.name, progressPercent: row.progressPercent }));
}

export async function getProjectCosts() {
  const costs = await prisma.projectCost.groupBy({ by: ["projectId"], _sum: { amount: true } });
  return costs.map((row) => ({ projectId: row.projectId, actualCost: row._sum.amount ?? new Prisma.Decimal(0) }));
}

export async function getProjectIssues() {
  const rows = await prisma.projectIssue.groupBy({ by: ["status"], _count: { _all: true } });
  return rows.map((row) => ({ status: row.status, count: row._count._all }));
}

export async function getProjectMaterials() {
  const rows = await prisma.projectMaterial.groupBy({ by: ["status"], _count: { _all: true }, _sum: { plannedQuantity: true, usedQuantity: true } });
  return rows.map((row) => ({ status: row.status, count: row._count._all, plannedQuantity: row._sum.plannedQuantity, usedQuantity: row._sum.usedQuantity }));
}

export async function getProjectEmployees() {
  const rows = await prisma.projectMember.groupBy({ by: ["employeeId"], where: { status: "active" }, _count: { _all: true } });
  return rows.map((row) => ({ employeeId: row.employeeId, activeProjects: row._count._all }));
}

export async function getProjectOverview() {
  const [status, progress, costs, issues, materials, employees] = await Promise.all([
    getProjectStatus(),
    getProjectProgress(),
    getProjectCosts(),
    getProjectIssues(),
    getProjectMaterials(),
    getProjectEmployees()
  ]);
  return { status, progress, costs, issues, materials, employees };
}

export async function getProjectDetailStatistics(id: string) {
  const [project, tasks, issues, materials, costs] = await Promise.all([
    prisma.project.findUnique({ where: { id } }),
    prisma.projectTask.groupBy({ by: ["status"], where: { projectId: id }, _count: { _all: true } }),
    prisma.projectIssue.groupBy({ by: ["status"], where: { projectId: id }, _count: { _all: true } }),
    prisma.projectMaterial.groupBy({ by: ["status"], where: { projectId: id }, _count: { _all: true } }),
    prisma.projectCost.aggregate({ where: { projectId: id }, _sum: { amount: true } })
  ]);
  return { project, tasks, issues, materials, costs };
}
