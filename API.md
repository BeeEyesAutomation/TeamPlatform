# API.md

## Auth

```txt
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/change-password
```

## Users, Roles, Permissions

```txt
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id

GET    /api/roles
POST   /api/roles
PUT    /api/roles/:id
DELETE /api/roles/:id

GET    /api/permissions
PUT    /api/roles/:id/permissions
```

## Employees

```txt
GET    /api/employees
POST   /api/employees
GET    /api/employees/:id
PUT    /api/employees/:id
DELETE /api/employees/:id
POST   /api/employees/:id/avatar
POST   /api/employees/:id/citizen-id-front
POST   /api/employees/:id/citizen-id-back
GET    /api/employees/:id/salary-preview
```

## Departments

```txt
GET    /api/departments
POST   /api/departments
PUT    /api/departments/:id
DELETE /api/departments/:id
```

## Positions

```txt
GET    /api/positions
POST   /api/positions
GET    /api/positions/:id
PUT    /api/positions/:id
DELETE /api/positions/:id
```

## Attendance

```txt
GET  /api/attendance?date=YYYY-MM-DD&departmentId=
POST /api/attendance/save
GET  /api/attendance/monthly?month=YYYY-MM&employeeId=
POST /api/attendance/lock
POST /api/attendance/unlock
```

## Allowances

```txt
GET    /api/allowance-types
POST   /api/allowance-types
GET    /api/allowance-types/:id
PUT    /api/allowance-types/:id
DELETE /api/allowance-types/:id

GET    /api/allowance-rules
POST   /api/allowance-rules
PUT    /api/allowance-rules/:id
DELETE /api/allowance-rules/:id

GET    /api/employee-monthly-allowances?month=YYYY-MM
POST   /api/employee-monthly-allowances
PUT    /api/employee-monthly-allowances/:id
DELETE /api/employee-monthly-allowances/:id
```

## Tax and Insurance

```txt
GET  /api/tax-settings
POST /api/tax-settings
GET  /api/tax-settings/:id
PUT  /api/tax-settings/:id

GET  /api/tax-settings/:id/brackets
POST /api/tax-settings/:id/brackets
PUT  /api/tax-brackets/:id
DELETE /api/tax-brackets/:id
```

## Payroll

```txt
POST /api/payroll/calculate?month=YYYY-MM
GET  /api/payroll?month=YYYY-MM
GET  /api/payroll/:id
POST /api/payroll/:id/recalculate
POST /api/payroll/finalize?month=YYYY-MM
POST /api/payroll/publish?month=YYYY-MM
POST /api/payroll/lock?month=YYYY-MM
POST /api/payroll/unlock?month=YYYY-MM
GET  /api/payroll/:id/payslip
GET  /api/payroll/export/excel?month=YYYY-MM
GET  /api/payroll/export/pdf?month=YYYY-MM
```

## Salary Advances

```txt
GET    /api/salary-advances?month=YYYY-MM
POST   /api/salary-advances
PUT    /api/salary-advances/:id
DELETE /api/salary-advances/:id
```

## Email

```txt
GET  /api/email/settings
PUT  /api/email/settings
POST /api/email/settings/test

GET  /api/email/templates
GET  /api/email/templates/:id
PUT  /api/email/templates/:id

GET  /api/email/logs
POST /api/email/logs/:id/retry
```

## Projects

```txt
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
GET    /api/projects/:id/dashboard
GET    /api/projects/:id/profile
PUT    /api/projects/:id/profile
```

## Project Contracts

```txt
GET  /api/projects/:projectId/contracts
POST /api/projects/:projectId/contracts
PUT  /api/project-contracts/:id
DELETE /api/project-contracts/:id
```

## Project Plans

```txt
GET    /api/projects/:projectId/plans
POST   /api/projects/:projectId/plans
PUT    /api/project-plans/:id
DELETE /api/project-plans/:id
```

## Project Tasks

```txt
GET  /api/projects/:projectId/tasks
POST /api/projects/:projectId/tasks
GET  /api/project-tasks/:id
PUT  /api/project-tasks/:id
DELETE /api/project-tasks/:id
POST /api/project-tasks/:id/confirm
POST /api/project-tasks/:id/progress
POST /api/project-tasks/:id/submit
POST /api/project-tasks/:id/approve
POST /api/project-tasks/:id/return
```

## Project Issues

```txt
GET  /api/projects/:projectId/issues
POST /api/projects/:projectId/issues
GET  /api/project-issues/:id
PUT  /api/project-issues/:id
DELETE /api/project-issues/:id
POST /api/project-issues/:id/close
POST /api/project-issues/:id/reopen
```

## Project Materials

```txt
GET    /api/projects/:projectId/materials
POST   /api/projects/:projectId/materials
PUT    /api/project-materials/:id
DELETE /api/project-materials/:id
```

## Purchase Requests

```txt
GET  /api/projects/:projectId/purchase-requests
POST /api/projects/:projectId/purchase-requests
PUT  /api/purchase-requests/:id
POST /api/purchase-requests/:id/approve
POST /api/purchase-requests/:id/reject
POST /api/purchase-requests/:id/mark-received
```

## Project Costs

```txt
GET    /api/projects/:projectId/costs
POST   /api/projects/:projectId/costs
PUT    /api/project-costs/:id
DELETE /api/project-costs/:id
```

## Project Members

```txt
GET    /api/projects/:projectId/members
POST   /api/projects/:projectId/members
PUT    /api/project-members/:id
DELETE /api/project-members/:id
```

## Project Documents

```txt
GET    /api/document-types
POST   /api/document-types
PUT    /api/document-types/:id
DELETE /api/document-types/:id

GET    /api/projects/:projectId/documents
POST   /api/projects/:projectId/documents/upload
GET    /api/project-documents/:id
PUT    /api/project-documents/:id
DELETE /api/project-documents/:id
GET    /api/project-documents/:id/download
POST   /api/project-documents/:id/approve
POST   /api/project-documents/:id/reject
GET    /api/project-documents/:id/access-logs
```

## Document Permissions

```txt
GET /api/document-permissions
PUT /api/document-permissions
```

## Import

```txt
GET  /api/imports/templates/:type
POST /api/imports/employees
POST /api/imports/attendance
POST /api/imports/allowances
POST /api/imports/projects
POST /api/imports/project-plans
POST /api/imports/project-tasks
POST /api/imports/project-issues
POST /api/imports/project-materials
POST /api/imports/project-costs
GET  /api/imports/logs
GET  /api/imports/logs/:id/error-file
```

## Export

```txt
GET /api/exports/employees
GET /api/exports/attendance
GET /api/exports/payroll
GET /api/exports/projects
GET /api/exports/projects/:id/full
GET /api/exports/project-progress
GET /api/exports/project-costs
GET /api/exports/project-issues
GET /api/exports/project-materials
GET /api/exports/project-performance
GET /api/exports/logs
```

## Statistics

```txt
GET /api/statistics/projects/overview
GET /api/statistics/projects/status
GET /api/statistics/projects/progress
GET /api/statistics/projects/costs
GET /api/statistics/projects/issues
GET /api/statistics/projects/materials
GET /api/statistics/projects/employees
GET /api/statistics/projects/:id
```

## Audit Logs

```txt
GET /api/audit-logs
GET /api/audit-logs/:id
```
