export const coreRoles = [
  "admin",
  "director",
  "hr",
  "accountant",
  "project_manager",
  "team_leader",
  "project_employee",
  "employee",
  "customer_partner"
] as const;

export const permissions = [
  "auth.me",
  "users.manage",
  "roles.manage",
  "employees.view",
  "employees.manage",
  "employees.view_sensitive",
  "attendance.manage",
  "attendance.lock",
  "payroll.view",
  "payroll.manage",
  "payroll.publish",
  "projects.view",
  "projects.manage",
  "project_documents.view",
  "project_documents.manage",
  "imports.manage",
  "exports.manage",
  "email.manage",
  "audit_logs.view"
] as const;

export type CoreRoleCode = (typeof coreRoles)[number];
export type PermissionCode = (typeof permissions)[number];
