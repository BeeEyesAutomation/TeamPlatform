import { Router } from "express";
import { attendanceRouter } from "./modules/attendance/attendance.routes";
import { auditRouter } from "./modules/audit/audit.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { allowancesRouter } from "./modules/allowances/allowances.routes";
import { departmentsRouter } from "./modules/departments/departments.routes";
import { emailRouter } from "./modules/email/email.routes";
import { employeesRouter } from "./modules/employees/employees.routes";
import { exportsRouter } from "./modules/exports/exports.routes";
import { importsRouter } from "./modules/imports/imports.routes";
import { inventoryRouter } from "./modules/inventory/inventory.routes";
import { payrollRouter, payrollsRouter, payslipsRouter } from "./modules/payroll/payroll.routes";
import { positionsRouter } from "./modules/positions/positions.routes";
import {
  documentPermissionsRouter,
  documentTypesRouter,
  projectDocumentsForProjectRouter,
  projectDocumentsRouter
} from "./modules/project-documents/project-documents.routes";
import {
  projectCostsRouter,
  projectIssuesRouter,
  projectMaterialsRouter,
  projectMembersRouter,
  projectPlansRouter,
  projectsRouter,
  projectTasksRouter
} from "./modules/projects/projects.routes";
import { reportsRouter } from "./modules/reports/reports.routes";
import { rolesRouter } from "./modules/roles/roles.routes";
import { salaryAdvancesRouter } from "./modules/salary-advances/salary-advances.routes";
import { statisticsRouter } from "./modules/statistics/statistics.routes";
import { taxBracketsRouter, taxRouter } from "./modules/tax/tax.routes";
import { usersRouter } from "./modules/users/users.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/roles", rolesRouter);
apiRouter.use("/permissions", rolesRouter);
apiRouter.use("/employees", employeesRouter);
apiRouter.use("/departments", departmentsRouter);
apiRouter.use("/positions", positionsRouter);
apiRouter.use("/attendance", attendanceRouter);
apiRouter.use("/allowance-types", allowancesRouter);
apiRouter.use("/allowance-rules", allowancesRouter);
apiRouter.use("/employee-monthly-allowances", allowancesRouter);
apiRouter.use("/payroll", payrollRouter);
apiRouter.use("/payrolls", payrollsRouter);
apiRouter.use("/payslips", payslipsRouter);
apiRouter.use("/salary-advances", salaryAdvancesRouter);
apiRouter.use("/tax-settings", taxRouter);
apiRouter.use("/tax-brackets", taxBracketsRouter);
apiRouter.use("/projects", projectDocumentsForProjectRouter);
apiRouter.use("/projects", projectsRouter);
apiRouter.use("/project-plans", projectPlansRouter);
apiRouter.use("/project-tasks", projectTasksRouter);
apiRouter.use("/project-issues", projectIssuesRouter);
apiRouter.use("/project-materials", projectMaterialsRouter);
apiRouter.use("/project-costs", projectCostsRouter);
apiRouter.use("/project-members", projectMembersRouter);
apiRouter.use("/document-types", documentTypesRouter);
apiRouter.use("/document-permissions", documentPermissionsRouter);
apiRouter.use("/project-documents", projectDocumentsRouter);
apiRouter.use("/email", emailRouter);
apiRouter.use("/imports", importsRouter);
apiRouter.use("/inventory", inventoryRouter);
apiRouter.use("/exports", exportsRouter);
apiRouter.use("/statistics", statisticsRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/audit-logs", auditRouter);
