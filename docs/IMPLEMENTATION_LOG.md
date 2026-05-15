# Implementation Log

## 2026-05-15 - Cleanup Duplicate Auth Files Blocking API Typecheck

### Current Phase

Recommended cleanup after material-name task validation.

### Scope

- Inspect only the duplicate auth files reported by API typecheck.
- Remove stale untracked duplicate files that TypeScript was compiling.
- Rerun API typecheck.
- Do not refactor auth or touch unrelated duplicate files.

### Assumptions

- Files with ` (1)` in the reported auth paths are local duplicate copies, not tracked source files.
- The tracked auth files are the canonical implementation.
- Existing unrelated working tree changes remain out of scope.

### Result

- Removed stale untracked duplicate files:
  - `apps/api/src/middleware/authenticate (1).ts`
  - `apps/api/src/modules/auth/auth (1).service.ts`
- API typecheck now passes.

### Changed Files Summary

- `docs/IMPLEMENTATION_LOG.md`

### Commands Run

- `Get-Content -Raw AGENTS.md`
- `Get-Content docs\IMPLEMENTATION_LOG.md -TotalCount 90`
- `git status --short --branch`
- `git diff --no-index -- apps\api\src\middleware\authenticate.ts "apps\api\src\middleware\authenticate (1).ts"`
- `git diff --no-index -- apps\api\src\modules\auth\auth.service.ts "apps\api\src\modules\auth\auth (1).service.ts"`
- `Get-Item "apps\api\src\middleware\authenticate (1).ts", "apps\api\src\modules\auth\auth (1).service.ts" | Select-Object FullName,Length,LastWriteTime`
- `Remove-Item -LiteralPath "apps\api\src\middleware\authenticate (1).ts", "apps\api\src\modules\auth\auth (1).service.ts"`
- `npm run typecheck --workspace apps/api`

### Failures and Logs

- No command failures.

### Remaining TODOs

- Other unrelated duplicate ` (1)` files still exist in the working tree but were not touched because they did not block this validation step.
## 2026-05-15 - Add Material Name Search to Materials

### Current Phase

Inventory/materials update: ensure material name is consistently available and searchable.

### Scope

- Verify the existing project materials model and API already include required `materialName`.
- Add material code/material name search to the materials list API.
- Add a material search input to the existing project materials frontend list.
- Document the project material API fields.
- Do not implement stock in/out, inventory dashboards, or unrelated module changes.

### Assumptions

- The existing materials implementation is the project materials module; no separate inventory-item module exists in the tracked source.
- `ProjectMaterial.materialName` is already required in Prisma and validation, so no schema migration is needed.
- Existing unrelated working tree changes are out of scope and remain untouched.

### Result

- Confirmed `materialName` exists in Prisma, backend validation, list/create/update responses, frontend list/form, and import/export helpers.
- Added `search` query support for project materials by `materialCode` or `materialName`.
- Added a frontend search input on the project materials tab.
- Updated `API.md` to list project material payload fields and search behavior.

### Changed Files Summary

- `API.md`
- `apps/api/src/modules/projects/projects.routes.ts`
- `apps/api/src/modules/projects/projects.schemas.ts`
- `apps/api/src/modules/projects/projects.service.ts`
- `apps/web/features/projects/project-detail-client.tsx`
- `apps/web/features/projects/projects-api.ts`
- `docs/IMPLEMENTATION_LOG.md`

### Commands Run

- `Get-Content -Raw AGENTS.md`
- `Get-Content -Raw docs\IMPLEMENTATION_LOG.md`
- `if (Test-Path docs\INVENTORY_PLAN.md) { Get-Content -Raw docs\INVENTORY_PLAN.md }`
- `Select-String -Path DATABASE.md -Pattern 'inventory|material|materials|stock' -Context 3,8`
- `Select-String -Path API.md -Pattern 'inventory|material|materials|stock' -Context 3,8`
- `rg --files apps\api\src apps\web | rg "(inventory|material|materials)"`
- `Select-String -Path apps\api\prisma\schema.prisma -Pattern 'model .*Material|Inventory|materialName|materialCode|stockQuantity' -Context 0,30`
- `rg -n "projectMaterials|ProjectMaterial|materialName|materialCode|materials" apps\api\src\modules\projects apps\web\features\projects apps\web\types apps\web\app\projects`
- `rg -n "project-materials|project materials|materialName|materialCode" apps\api\src docs API.md DATABASE.md`
- `rg -n "stockQuantity|minimumStock|minimumStockQuantity|purchasePrice|sellingPrice|markupPercentage|InventoryItem|inventoryItem|materialName" apps\api apps\web docs DATABASE.md API.md`
- `Get-Content -Raw apps\api\src\modules\projects\projects.schemas.ts`
- `Get-Content -Raw apps\api\src\modules\projects\projects.service.ts`
- `Get-Content -Raw apps\api\src\modules\projects\projects.routes.ts`
- `Get-Content -Raw apps\web\features\projects\project-detail-client.tsx`
- `Get-Content -Raw apps\web\features\projects\projects-api.ts`
- `Get-Content -Raw apps\web\types\projects.ts`
- `npm run typecheck --workspace apps/api`
- `npm run typecheck --workspace apps/api *>&1 | Tee-Object -FilePath docs\logs\2026-05-15_material-name_api-typecheck.log`
- `npm run typecheck --workspace apps/web`
- `git diff --check -- API.md apps/api/src/modules/projects/projects.routes.ts apps/api/src/modules/projects/projects.schemas.ts apps/api/src/modules/projects/projects.service.ts apps/web/features/projects/project-detail-client.tsx apps/web/features/projects/projects-api.ts docs/IMPLEMENTATION_LOG.md docs/logs/2026-05-15_material-name_api-typecheck.log`

### Failures and Logs

- `docs/logs/2026-05-15_material-name_api-typecheck.log` - `type_error`; API typecheck failed because unrelated untracked duplicate files are included by TypeScript:
  - `apps/api/src/middleware/authenticate (1).ts`
  - `apps/api/src/modules/auth/auth (1).service.ts`
- No fix was applied because those files are unrelated to this inventory/material task.

### Remaining TODOs

- Remove or reconcile the unrelated duplicate ` (1)` TypeScript files, then rerun `npm run typecheck --workspace apps/api`.
## 2026-05-15 - Documentation Token and Context Optimization Rules

### Current Phase

Documentation update: token and context optimization rules.

### Scope

- Add strict token and context optimization rules to `AGENTS.md`.
- Record the documentation-only update in this implementation log.
- Do not change application code.

### Assumptions

- Existing unrelated working tree changes are out of scope and remain untouched.
- No application validation is required because this task changes documentation only.

### Result

- Added the `Token and Context Optimization Rules` section to `AGENTS.md`.
- Documented expectations for scoped reading, implementation-log usage, narrow changes, concise responses, targeted searches, efficient tests, failure handling, Prisma/database efficiency, frontend/backend inspection limits, and commit discipline.

### Changed Files Summary

- `AGENTS.md`
- `docs/IMPLEMENTATION_LOG.md`

### Commands Run

- `Get-Content -Raw AGENTS.md`
- `Get-Content -Raw docs\IMPLEMENTATION_LOG.md`
- `Get-Content -Raw docs\DECISIONS.md`
- `git status --short --branch`
- `Get-Content docs\IMPLEMENTATION_LOG.md -TotalCount 40`
- `Get-Content AGENTS.md -Tail 40`
- `git diff --check -- AGENTS.md docs/IMPLEMENTATION_LOG.md`
- `git diff --stat -- AGENTS.md docs/IMPLEMENTATION_LOG.md`
- `git diff -- AGENTS.md docs/IMPLEMENTATION_LOG.md`
- `git add AGENTS.md docs/IMPLEMENTATION_LOG.md`
- `git commit -m "Add token optimization rules"`
- `git push`

### Failures and Logs

- No command failures.

### Remaining TODOs

- None for this documentation update.

## 2026-05-06 - Phase 11 Hardening, Cleanup, Final Review

### Current Phase

Phase 11: Hardening, Cleanup, Final Review.

### Scope

- Review implemented modules for obvious route/security/build issues.
- Tighten docs, setup instructions, environment examples, and troubleshooting notes.
- Verify Prisma, API/web typecheck, targeted tests, broader tests where reasonable, and production build once near the end.
- Keep changes focused on cleanup, consistency, security, and build health.

### Assumptions

- Existing unrelated local generated files remain outside this commit.
- No new business feature scope is added in this phase.
- Protected export/template downloads should use authenticated fetches rather than unauthenticated browser navigation.

### Planned Commands

- `npx prisma validate`
- `npx prisma generate`
- `npm run typecheck --workspace apps/api`
- `npm run typecheck --workspace apps/web`
- Targeted unit tests
- Full test suite if reasonably fast
- Production build once near the end if configured
- `git diff --check`

### Result

- Fixed protected import template/export downloads in the web UI to use authenticated `fetch` with blob download instead of unauthenticated browser navigation.
- Updated `.env.example` with `NEXT_PUBLIC_API_URL`.
- Rewrote README setup/run/check commands to match the implemented monorepo.
- Added final decisions for month values, attendance defaults, audit-backed project timeline, document reject permission, SMTP password references, and import foundation behavior.
- Added `docs/TODO.md` for production hardening and follow-up work.
- Expanded troubleshooting notes for PostgreSQL auth, missing `DATABASE_URL`, Redis, ESM/CommonJS, PowerShell execution policy, and GitHub CLI.
- Fixed shared package ESM barrel exports so production build passes under NodeNext rules.

### Review Notes

- Sensitive API groups use RBAC middleware: payroll, employee sensitive handling, project documents, import/export, email, audit logs, and project modules.
- Project document access is enforced server-side through document type, security level, role permission, project membership, and action checks.
- Payroll calculations have targeted tests in `apps/api/src/modules/payroll/payroll.calculator.test.ts`.
- Prisma migration status reports the local database schema is up to date.
- Docker Compose config is valid and local PostgreSQL/Redis containers are healthy.

### Commands Run

- `npx prisma validate --schema apps/api/prisma/schema.prisma` - failed once due missing `DATABASE_URL`, then passed with local dev `DATABASE_URL`.
- `npx prisma generate --schema apps/api/prisma/schema.prisma` - passed.
- `npm run typecheck --workspace apps/api` - passed.
- `npm run typecheck --workspace apps/web` - passed.
- `npm run test --workspace apps/api -- payroll.calculator project-documents.permissions email.renderer imports.utils` - passed.
- `npm test` - passed.
- `npm run build` - failed once due shared package ESM extension config, then passed after the targeted fix.
- `docker compose config` - passed.
- `docker compose ps` - PostgreSQL and Redis are running healthy locally.
- `npx prisma migrate status --schema apps/api/prisma/schema.prisma` - database schema is up to date.
- `git diff --check` - passed with line-ending warnings only.

### Failures and Logs

- `docs/logs/2026-05-06_phase-11_prisma-validate.log` - `env_missing`; reran with local development `DATABASE_URL`.
- `docs/logs/2026-05-06_phase-11_build.log` - `config_error`; fixed shared package ESM relative export extensions.

### Remaining TODOs

- See `docs/TODO.md`.

## 2026-05-06 - Phase 10 Import, Export, and Reports

### Current Phase

Phase 10: Import, Export, and Reports.

### Scope

- Implement Excel import template generation, metadata-based upload/preview/confirm import workflow, import logs, and error-file download foundation.
- Implement Excel/CSV/PDF export endpoints for HR, attendance, payroll, projects, project detail, progress, costs, issues, and materials.
- Implement reporting/statistics dashboard APIs for HR, payroll, project, issue, material, and cost overviews.
- Add frontend import center, export center, and reports dashboard.
- Add targeted parser/exporter tests if present or a narrow utility test where useful.
- Do not implement e2e tests, production build, or full test suite.

### Assumptions

- File upload is represented by JSON rows in this foundation pass; multipart upload/storage can be added later without changing the import log contract.
- Import preview rows/errors are stored in `ImportLog.metadata`; confirmed imports update log status/counts and insert supported rows where a safe minimal mapping exists.
- PDF export foundation returns generated PDF buffers for payslip and project summary paths using HTML rendering helpers; no production styling guarantee in this phase.
- Existing unrelated working tree changes are not reverted.

### Planned Commands

- `npm run typecheck --workspace apps/api`
- `npm run typecheck --workspace apps/web`
- Targeted parser/exporter tests only.
- `git diff --check`

### Result

- Implemented Excel template downloads for employees, projects, project plans, tasks, issues, materials, costs, and allowances.
- Implemented JSON-row import preview/confirm foundation with row validation, import logs, and downloadable Excel error files.
- Implemented export endpoints for employee, attendance, payroll, project list, project full report, project progress, costs, issues, materials, and performance.
- Added Excel, CSV, and PDF response generation foundation and export logs.
- Added HR, payroll, project, issue, material, cost, and employee project performance statistics APIs.
- Added frontend import center, export center, and reports dashboard.
- Added targeted utility tests for import type recognition, row validation, and CSV export.

### Changed Files Summary

- Backend imports: `apps/api/src/modules/imports/imports.schemas.ts`, `apps/api/src/modules/imports/imports.service.ts`, `apps/api/src/modules/imports/imports.utils.ts`, `apps/api/src/modules/imports/imports.routes.ts`
- Backend exports/statistics: `apps/api/src/modules/exports/exports.schemas.ts`, `apps/api/src/modules/exports/exports.service.ts`, `apps/api/src/modules/exports/exports.routes.ts`, `apps/api/src/modules/statistics/statistics.service.ts`, `apps/api/src/modules/statistics/statistics.routes.ts`
- Backend tests: `apps/api/src/modules/imports/imports.utils.test.ts`
- Frontend: `apps/web/app/import-export/page.tsx`, `apps/web/app/reports/page.tsx`, `apps/web/features/import-export/*`, `apps/web/features/reports/*`, `apps/web/types/import-export.ts`, `apps/web/components/layout/app-shell.tsx`

### Commands Run

- `npm run test --workspace apps/api -- imports.utils` - passed.
- `npm run typecheck --workspace apps/api` - passed.
- `npm run typecheck --workspace apps/web` - passed.
- `git diff --check` - passed with line-ending warnings only.

### Failures and Logs

- No Phase 10 command failures.

### Remaining TODOs

- Multipart Excel upload parsing is deferred; current import preview/confirm accepts JSON rows and writes logs.
- PDF exports use a simple HTML table foundation; production report styling can be added later.
- Import mappings are complete for safe minimal employees/projects upsert; other import types currently validate and log preview data only.

## 2026-05-06 - Phase 9 SMTP Email Automation with Queue

### Current Phase

Phase 9: SMTP Email Automation with Queue.

### Scope

- Implement configurable SMTP settings, test email enqueueing, templates, email logs, retry, BullMQ queue, and Nodemailer worker.
- Trigger queued email jobs for task assignment, task confirmation, task progress update, issue creation, issue resolution, and payroll publication.
- Add frontend pages for SMTP settings, email templates, and email logs.
- Add targeted email service tests with mocked SMTP behavior and no real email sending.
- Do not implement import/export reports, production build, or real SMTP sends in tests.

### Assumptions

- SMTP password is stored in the existing `passwordEncrypted` field as either an environment reference (`env:NAME`) or a local encrypted/string placeholder; Phase 9 does not introduce a new secrets service.
- Email jobs are queued through BullMQ; worker startup is imported by the API server but can be disabled in tests.
- Payroll publication emails use a generic notification and do not include sensitive salary details.
- Existing unrelated working tree changes are not reverted.

### Planned Commands

- `npm run typecheck --workspace apps/api`
- `npm run typecheck --workspace apps/web`
- Targeted email service tests only.
- `git diff --check`

### Result

- Implemented SMTP settings APIs, including active setting management, environment variable password references, and queued test email creation.
- Implemented email template list/detail/update APIs and seeded concrete template subjects/bodies for required triggers.
- Implemented email log listing and retry, including pending, sent, failed, and retrying states.
- Implemented BullMQ email queue helpers and a Nodemailer-backed worker that processes email log jobs.
- Added queued email triggers for task assignment, task confirmation, task progress update, issue creation, issue resolution, project document pending approval, and payroll publication.
- Payroll publication email payloads are sanitized and do not include salary, tax, or bank details.
- Added frontend SMTP settings, template editing, and email log/retry page.
- Added targeted email renderer tests with no real SMTP sending.

### Changed Files Summary

- Backend email: `apps/api/src/modules/email/email.schemas.ts`, `apps/api/src/modules/email/email.service.ts`, `apps/api/src/modules/email/email.renderer.ts`, `apps/api/src/modules/email/email.routes.ts`
- Backend queue/worker: `apps/api/src/jobs/queues.ts`, `apps/api/src/jobs/email.worker.ts`, `apps/api/src/server.ts`
- Backend triggers: `apps/api/src/modules/projects/projects.service.ts`, `apps/api/src/modules/project-documents/project-documents.service.ts`, `apps/api/src/modules/payroll/payroll.service.ts`
- Backend tests/seed: `apps/api/src/modules/email/email.renderer.test.ts`, `apps/api/prisma/seed.ts`
- Frontend email: `apps/web/app/email/page.tsx`, `apps/web/features/email/*`, `apps/web/types/email.ts`, `apps/web/components/layout/app-shell.tsx`
- Logs: `docs/logs/2026-05-06_phase-9_*.log`

### Commands Run

- `npm run test --workspace apps/api -- email.renderer` - passed.
- `npm run typecheck --workspace apps/api` - failed once, then passed after the Prisma JSON metadata fix.
- `npm run typecheck --workspace apps/web` - passed.
- `git diff --check` - passed with line-ending warnings only.

### Failures and Logs

- `docs/logs/2026-05-06_phase-9_api-typecheck.log` - `type_error`; fixed by casting queued email metadata variables at the Prisma JSON boundary.

### Remaining TODOs

- Real SMTP delivery was not manually exercised, per the no-real-email rule.
- Redis availability was not tested because no dev server or worker execution command was run.
- SMTP password handling supports `env:NAME` references and stored placeholder strings; stronger encryption can be added when a secrets/key-management approach is selected.

## 2026-05-06 - Phase 8 Project Documents and Document Permissions

### Current Phase

Phase 8: Project Documents and Document Permissions.

### Scope

- Implement document type CRUD and seed the required project document types.
- Implement configurable document permissions by role, document type, optional security level, and action booleans.
- Implement project document metadata upload/list/view/update/archive/approve/reject/download URL APIs.
- Enforce server-side permissions and log view/download/upload/edit/delete/approve/reject access events.
- Add project documents tab, document permission settings page, and document access log view.
- Add targeted document permission tests for deny/allow, confidential restrictions, approve/reject, and access log writing.
- Do not implement SMTP/email queue, import/export, reports, or real object storage upload streaming in this phase.

### Assumptions

- File upload is metadata-only in Phase 8; `fileUrl` stores an already available URL/path.
- The existing `DocumentPermission` schema does not have `canReject`, so reject uses `canApprove`.
- Project membership is required for non-admin document access; admins with matching permissions are allowed through even if not members.
- `client_shared` security level may be accessed by `customer_partner` when a matching document permission exists and project membership is present.
- Existing unrelated working tree changes are not reverted.

### Planned Commands

- `npx prisma format` if Prisma schema changes are required.
- `npx prisma validate` if Prisma schema changes are required.
- `npx prisma generate` if Prisma schema changes are required.
- `npm run typecheck --workspace apps/api`
- `npm run typecheck --workspace apps/web`
- Targeted document permission tests only.
- `git diff --check`

### Result

- Implemented document type CRUD and kept the required seed document types.
- Implemented document permission list/upsert by role, document type, optional security level, and action booleans.
- Implemented project document metadata list/upload/view/update/archive/approve/reject/download APIs.
- Added server-side document access checks using user roles, coarse permissions, project membership, document type, security level, and action.
- Added access logs for upload, view, edit, delete/archive, approve, reject, and download actions.
- Added seeded default document permission matrix for admin, project manager, team leader, project employee, and customer partner roles.
- Added a project documents tab, document permission settings page, and access log panel.
- Added targeted document permission tests for deny/allow, confidential restrictions, approve/reject, and access log payload creation.
- Prisma schema was not changed for Phase 8, so Prisma format/validate/generate were not run.

### Changed Files Summary

- Backend documents: `apps/api/src/modules/project-documents/project-documents.permissions.ts`, `apps/api/src/modules/project-documents/project-documents.schemas.ts`, `apps/api/src/modules/project-documents/project-documents.service.ts`, `apps/api/src/modules/project-documents/project-documents.routes.ts`, `apps/api/src/routes.ts`
- Backend tests: `apps/api/src/modules/project-documents/project-documents.permissions.test.ts`
- Seed/shared permissions: `apps/api/prisma/seed.ts`, `packages/shared/src/permissions.ts`
- Frontend documents: `apps/web/features/project-documents/*`, `apps/web/types/project-documents.ts`, `apps/web/app/document-permissions/page.tsx`, `apps/web/features/projects/project-detail-client.tsx`, `apps/web/components/layout/app-shell.tsx`
- Logs: `docs/logs/2026-05-06_phase-8_*.log`

### Commands Run

- `npm run test --workspace apps/api -- project-documents.permissions` - passed.
- `npm run typecheck --workspace apps/api` - failed once, then passed after the nullable security-level Prisma input fix.
- `npm run typecheck --workspace apps/web` - passed.
- `git diff --check` - passed with line-ending warnings only.

### Failures and Logs

- `docs/logs/2026-05-06_phase-8_api-typecheck.log` - `type_error`; fixed by avoiding nullable `securityLevel` compound-unique upserts and using find/update/create instead.

### Remaining TODOs

- Real object storage upload streaming is still deferred; Phase 8 stores file metadata URL/path only.
- Reject permission reuses `canApprove` because the current `DocumentPermission` schema does not have `canReject`.
- Document access logs are available per document; broader filtering/reporting remains out of scope.

## 2026-05-06 - Phase 7 Project Core Management

### Current Phase

Phase 7: Project Core Management.

### Scope

- Implement project profile CRUD, plans, tasks, issues, materials, costs, members, per-project dashboard summary, and timeline activity.
- Add RBAC enforcement and audit logging for project-core changes.
- Add frontend projects list and project detail tabs for overview, profile, plan, tasks, issues, materials, costs, members, and timeline.
- Do not implement document permissions, SMTP/email queue, import/export, reports, or project documents in this phase.

### Assumptions

- Existing Prisma project-core models are sufficient; no Prisma schema change is planned.
- Project timeline entries are backed by audit logs with `module: "projects"` and the project id in metadata, because the current schema does not include a dedicated project activity log model.
- `projects.view` allows viewing projects and project detail collections; `projects.manage` allows state-changing project-core operations.
- Task assignment email side effects are deferred to the later SMTP/email queue phase.
- Purchase requests and contracts are out of scope for this Phase 7 pass unless needed by existing project-core models.
- Existing unrelated working tree changes are not reverted.

### Planned Commands

- `npx prisma format` if Prisma schema changes are required.
- `npx prisma validate` if Prisma schema changes are required.
- `npx prisma generate` if Prisma schema changes are required.
- `npm run typecheck --workspace apps/api`
- `npm run typecheck --workspace apps/web`
- Targeted project service tests only if present.
- `git diff --check`

### Result

- Implemented project CRUD/profile APIs and soft cancellation for project deletion.
- Implemented project plan, task, issue, material, cost, and member APIs, including task confirm/progress/submit/approve/return and issue close/reopen.
- Implemented per-project dashboard summary for project statuses, project/task progress, task statuses, issue statuses, material statuses, material cost estimates, and estimated vs actual costs.
- Added audit logging for project-core mutations and exposed a per-project timeline backed by project audit log entries.
- Added project RBAC seed assignments for director, project manager, team leader, project employee, and employee roles.
- Added frontend projects list and project detail tabs for overview, profile, plan, tasks, issues, materials, costs, members, and timeline.
- Prisma schema was not changed for Phase 7, so Prisma format/validate/generate were not run.

### Changed Files Summary

- Backend project core: `apps/api/src/modules/projects/projects.schemas.ts`, `apps/api/src/modules/projects/projects.service.ts`, `apps/api/src/modules/projects/projects.routes.ts`, `apps/api/src/routes.ts`
- Backend seed: `apps/api/prisma/seed.ts`
- Frontend project core: `apps/web/app/projects/page.tsx`, `apps/web/app/projects/[id]/page.tsx`, `apps/web/features/projects/projects-api.ts`, `apps/web/features/projects/projects-client.tsx`, `apps/web/features/projects/project-detail-client.tsx`, `apps/web/types/projects.ts`, `apps/web/components/layout/app-shell.tsx`
- Logs: `docs/logs/2026-05-06_phase-7_*.log`

### Commands Run

- `rg --files apps/api/src | rg "(project|projects).*(test|spec)|vitest"` - no targeted project tests found; logged as inspection no-match.
- `npm run typecheck --workspace apps/api` - failed once, then passed after a narrow import fix.
- `npm run typecheck --workspace apps/web` - passed.
- `git diff --check` - passed with line-ending warnings only.

### Failures and Logs

- `docs/logs/2026-05-06_phase-7_inspect-project-tests.log` - `unknown`; no existing targeted project test files were found.
- `docs/logs/2026-05-06_phase-7_api-typecheck.log` - `type_error`; fixed by importing `Prisma` as a runtime value in the project service.
- `docs/logs/2026-05-06_phase-7_github-cli.log` - `missing_system_tool`; `gh` is not installed, so commit/push/PR update is blocked by the publish workflow prerequisite. Manual setup documented in `docs/SETUP_TROUBLESHOOTING.md`.

### Remaining TODOs

- Dedicated project activity log table can be added later if the schema is expanded; timeline currently uses project audit logs.
- Cost deletion uses hard delete because the current `ProjectCost` model has no status or deleted timestamp.
- Task assignment and issue notification emails are deferred to the SMTP/email queue phase.
- Project documents, document permissions, import/export, and reports remain out of scope for Phase 7.
- Commit, push, and PR update remain pending until GitHub CLI is installed and authenticated.
- Existing unrelated working tree files were left untouched.

## 2026-05-06 - Phase 6 Payroll Calculation and Payslips

### Current Phase

Phase 6: Payroll Calculation and Payslips.

### Scope

- Implement Decimal-safe payroll calculation using position salary, attendance, configured allowances, salary advances, insurance, tax brackets, deductions, and net salary.
- Store itemized payroll items for each calculated payroll record.
- Implement payroll calculation, list/detail, approve, publish, lock, and employee self-service payslip APIs.
- Add RBAC and audit logs for payroll calculation and state changes.
- Add basic frontend pages for payroll calculation, payroll list/detail, and employee payslip view.
- Add targeted payroll unit tests for required formulas and calculation branches.
- Do not implement project, email, import/export, reports, production exports, or full payroll email notification.

### Assumptions

- Month values remain `YYYY-MM` strings.
- `position_salary` is calculated from the employee position and salary level; employees without a position are skipped for calculation.
- Existing manual attendance records define working days for the month; missing employee records on saved attendance dates are treated as `present`.
- Configured allowance types with `company` scope apply to all active employees; employee monthly allowances cover manual bonuses, project bonuses, deductions, and employee-specific adjustments when present.
- Attendance-rate allowance threshold is read from `allowanceType.metadata.minAttendancePercent` when present; otherwise the allowance is not granted unless the threshold is absent.
- Insurance uses the configured percentage rates against the insurance base.
- Existing unrelated working tree changes are not reverted.

### Planned Commands

- `npx prisma format` if Prisma schema changes are required.
- `npx prisma validate` if Prisma schema changes are required.
- `npx prisma generate` if Prisma schema changes are required.
- `npm run typecheck --workspace apps/api`
- `npm run typecheck --workspace apps/web`
- Targeted payroll unit tests only.
- `git diff --check`

### Result

- Implemented Decimal-safe payroll calculator with position salary, configured allowances, insurance, tax brackets, deductions, salary advance field support, and net salary.
- Stored itemized payroll items during calculation and replaced draft item rows on recalculation.
- Added payroll APIs for calculate, list, detail, approve/finalize, publish, lock, and self-service payslip.
- Added RBAC checks for payroll view/manage/publish and audit logs for calculation and status changes.
- Added payroll calculation/list, detail, and employee payslip pages.
- Added targeted payroll calculator tests for salary formula, per-working-day allowance, attendance-rate allowance, taxable and insurance-based item separation, progressive tax brackets, and net salary.
- Prisma schema was not changed, so Prisma format/validate/generate were not run.

### Changed Files Summary

- Backend payroll: `apps/api/src/modules/payroll/payroll.calculator.ts`, `apps/api/src/modules/payroll/payroll.service.ts`, `apps/api/src/modules/payroll/payroll.routes.ts`, `apps/api/src/modules/payroll/payroll.schemas.ts`, `apps/api/src/routes.ts`
- Backend tests: `apps/api/src/modules/payroll/payroll.calculator.test.ts`
- Backend RBAC seed: `apps/api/prisma/seed.ts`
- Typecheck unblockers: `apps/api/src/modules/employees/employees.service.ts`, `apps/api/src/modules/positions/positions.service.ts`
- Frontend payroll: `apps/web/app/payroll/page.tsx`, `apps/web/app/payroll/[id]/page.tsx`, `apps/web/app/payroll/payslip/page.tsx`, `apps/web/features/payroll/payroll-client.tsx`, `apps/web/features/payroll/payroll-detail-client.tsx`, `apps/web/features/payroll/payslip-client.tsx`, `apps/web/features/payroll/payroll-api.ts`, `apps/web/types/payroll.ts`, `apps/web/components/layout/app-shell.tsx`
- Logs: `docs/logs/2026-05-06_phase-6_*.log`

### Commands Run

- `npm run test --workspace apps/api -- payroll.calculator` - failed once due an incorrect expected value in the new test, then passed after correcting the assertion.
- `npm run typecheck --workspace apps/api` - failed once due pre-existing employee/position Prisma typing issues, then passed after narrow service typing fixes.
- `npm run typecheck --workspace apps/web` - passed.
- `git diff --check` - passed with line-ending warnings only.

### Failures and Logs

- `docs/logs/2026-05-06_phase-6_targeted-payroll-tests.log` - `test_assertion_error`; fixed expected progressive tax and net salary values.
- `docs/logs/2026-05-06_phase-6_api-typecheck.log` - `type_error`; fixed narrow employee/position service Prisma input typing and generic masking typing.
- `docs/logs/2026-05-06_phase-6_inspect-api-files.log`, `docs/logs/2026-05-06_phase-6_inspect-tests.log`, `docs/logs/2026-05-06_phase-6_inspect-web-files.log`, `docs/logs/2026-05-06_phase-6_inspect-schema-slice.log` - `unknown`; command syntax/path issues during inspection, corrected with narrower PowerShell commands.

### Remaining TODOs

- Salary advances, employee-specific manual bonuses, project bonuses, and employee monthly adjustments remain limited by the current schema/API surface; payroll currently uses configured company-scope allowance types and a zero salary advance default.
- Payroll month locking is represented by per-payroll `locked` status; a separate month lock table/process is not yet implemented.
- Existing unrelated working tree files were left untouched.

## 2026-05-06 - Phase 5 Payroll Configuration

### Current Phase

Phase 5: Payroll Configuration.

### Scope

- Implement configurable payroll settings only: tax settings, tax brackets, and allowance types.
- Add backend CRUD-style APIs, validation, RBAC, and audit logs for payroll configuration.
- Add seed examples where suitable for configured allowances and tax/insurance settings.
- Add a basic frontend payroll settings page for tax settings, tax brackets, and allowance types.
- Do not implement final payroll calculation, payroll runs, payslips, projects, email, import/export, or reports.

### Assumptions

- Decimal money/rate values are accepted as strings or numbers by API inputs and stored through Prisma Decimal fields.
- Existing `RecordStatus`, `AllowanceCalculationType`, and `ApplyScope` schema enums remain the source of allowed values.
- Tax brackets are managed globally through `/api/tax-brackets` while still requiring a `taxSettingId` relationship.
- Deactivation is preferred over destructive deletes for allowance types and tax brackets where the current schema supports status.
- RBAC uses a new or existing payroll configuration permission assigned to admin, HR, and accountant roles in seed data.
- Pre-existing unrelated working tree changes are not reverted.

### Planned Commands

- `npx prisma format` if Prisma schema changes are required.
- `npx prisma validate` if Prisma schema changes are required.
- `npx prisma generate` if Prisma schema changes are required.
- `npm run typecheck --workspace apps/api`
- `npm run typecheck --workspace apps/web`
- Targeted payroll configuration tests only if available.
- `git diff --check`

### Changed Files Summary

- `apps/api/src/modules/tax/*`: Implemented tax settings and tax bracket schemas, services, RBAC-protected routes, validation, activation, and audit logs.
- `apps/api/src/modules/allowances/*`: Implemented allowance type schemas, services, RBAC-protected routes, validation, soft deactivation, and audit logs.
- `apps/api/src/routes.ts`: Added `/api/tax-brackets` routing alongside `/api/tax-settings`.
- `apps/api/prisma/seed.ts`: Added `payroll.configure`, assigned it to HR and accountant roles, and seeded example allowance types.
- `apps/api/tsconfig.json`: Added API-specific `module` and `moduleResolution` settings so existing extensionless TypeScript imports are compatible with local typecheck, and kept `prisma/seed.ts` within the configured include set.
- `apps/web/app/payroll/settings/page.tsx`: Added the payroll settings route.
- `apps/web/features/payroll/*`: Added payroll configuration API client and settings UI.
- `apps/web/types/payroll.ts`: Added payroll configuration frontend types.
- `apps/web/components/layout/app-shell.tsx`: Pointed the payroll navigation item to `/payroll/settings`.
- `docs/logs/2026-05-06_phase-5_*.log`: Captured failed command/inspection output.
- `docs/IMPLEMENTATION_LOG.md`: Documented Phase 5 work and validation status.

### Commands Run

- `Get-Content -Raw AGENTS.md`
- `Get-Content -Raw docs/IMPLEMENTATION_LOG.md`
- `Get-Content -Raw docs/DECISIONS.md`
- `Select-String` scoped to payroll configuration sections in `REQUIREMENTS.md`, `DATABASE.md`, `API.md`, and `WORKFLOWS.md`
- `Get-ChildItem` / `Get-Content` for current tax, allowance, HR utility, route, seed, and frontend files
- `rg "payroll.configure|taxBracketsRouter|allowanceType|TaxSetting|PayrollSettings" apps/api/src apps/api/prisma apps/web -n`
- `npm run typecheck --workspace apps/api`

### Tests/Checks Run

- Prisma commands were not run because Phase 5 did not change the Prisma schema.
- `npm run typecheck --workspace apps/api` failed.
  - Log file: `docs/logs/2026-05-06_phase-5_api-typecheck.log`
  - First failure class: `config_error`; the API inherited `NodeNext`/Node16 module resolution while the codebase uses extensionless TypeScript imports.
  - Targeted fix: added API-specific `module: "ESNext"` and `moduleResolution: "Bundler"`.
  - Rerun result: failed with `type_error`.
  - Two new allowance metadata typing errors were patched after the failed rerun.
  - Remaining blockers shown in the log are existing HR/employee/position Prisma typing issues outside Phase 5.
- Web typecheck, targeted payroll configuration tests, `git diff --check`, production build, full test suite, payroll calculation tests, project tests, email tests, and e2e tests were not run after the API typecheck rerun failed, per the stop rule.

### Fixes Applied

- Added Zod validation for non-negative money values, rates between 0 and 100, valid tax bracket ranges, enum values, and UUID params.
- Added audit logs for tax settings, tax brackets, and allowance type create/update/activate/delete/deactivate actions.
- Added RBAC protection through `payroll.configure` for payroll configuration endpoints and UI access.
- Added default allowance examples for meal allowance, attendance bonus, travel allowance, and project bonus.
- Patched the new allowance metadata Prisma JSON typing after the failed typecheck rerun.

### Remaining TODOs

- Resolve existing API type errors in `employees.service.ts` and `positions.service.ts`, then rerun `npm run typecheck --workspace apps/api`.
- After API typecheck is unblocked, run `npm run typecheck --workspace apps/web`.
- Add targeted payroll configuration tests when the project has a test file pattern for this module.

## 2026-05-06 - Phase 4 Manual Attendance Completion

### Current Phase

Phase 4: Simple Manual Attendance.

### Scope

- Complete manual attendance APIs for daily attendance save/view and monthly summaries.
- Ensure daily attendance defaults missing records to `present`.
- Use only Phase 4 attendance statuses: `present`, `paid_leave`, and `unpaid_leave` at the API/frontend boundary.
- Preserve existing attendance lock behavior if already implemented, without expanding into payroll or other modules.
- Add or verify RBAC and audit logging for attendance changes.
- Complete a basic web attendance screen with date selection, employee status selection, bulk save, and monthly summary.
- Do not implement payroll calculation, projects, email, import/export, reports, check-in/check-out, late/early tracking, GPS, or QR code.

### Assumptions

- Existing Phase 2 RBAC permissions are the source of authorization.
- If manager scoping is not represented in the current schema/services, managers use the same attendance management permission until a scope model exists.
- Employee self-service attendance views are deferred unless existing auth/user-to-employee linkage already supports them.
- Business dates are accepted as `YYYY-MM-DD` and normalized consistently in the service layer.
- Month values stay as `YYYY-MM` strings.
- Pre-existing unrelated working tree changes are not reverted.

### Planned Commands

- `npx prisma format` if Prisma schema changes are required.
- `npx prisma validate` if Prisma schema changes are required.
- `npx prisma generate` if Prisma schema changes are required.
- `npm run typecheck --workspace apps/api`
- `npm run typecheck --workspace apps/web` if frontend changes are required.
- Targeted attendance tests only if available.
- `git diff --check`

### Changed Files Summary

- `apps/api/src/modules/attendance/attendance.schemas.ts`: Updated the API request status names to `present`, `paid_leave`, and `unpaid_leave`.
- `apps/api/src/modules/attendance/attendance.service.ts`: Added API-to-database status mapping, returned API status names, and calculated monthly summaries with missing records treated as `present` on saved attendance dates.
- `apps/api/src/modules/attendance/attendance.repository.ts`: Added distinct saved attendance date lookup for monthly summary working-day calculation.
- `apps/web/types/attendance.ts`: Updated frontend attendance status types to the API status names.
- `apps/web/features/attendance/attendance-client.tsx`: Updated the daily status selector values to `paid_leave` and `unpaid_leave`.
- `apps/api/tsconfig.json`: Removed the unsupported local `ignoreDeprecations: "6.0"` config value during API typecheck failure handling; the pre-existing local `rootDir` change remains otherwise untouched.
- `docs/logs/2026-05-06_phase-4_api-typecheck.log`: Captured API typecheck failures.
- `docs/logs/2026-05-06_phase-4_inspect-tests.log`: Captured an inspection command syntax failure.
- `docs/IMPLEMENTATION_LOG.md`: Documented Phase 4 completion work and remaining validation blocker.

### Commands Run

- `Get-Content -Raw AGENTS.md`
- `Get-Content -Raw docs/IMPLEMENTATION_LOG.md`
- `Get-Content -Raw docs/DECISIONS.md`
- `Select-String` scoped to attendance sections in `REQUIREMENTS.md`, `DATABASE.md`, `API.md`, and `WORKFLOWS.md`
- `Get-ChildItem` and `Get-Content` for attendance-related backend/frontend files
- `rg "attendance\\." apps/api/prisma/seed.ts apps/api/src -n`
- `rg "leave_paid|leave_unpaid|paid_leave|unpaid_leave" apps/api apps/web packages -n`
- `npm run typecheck --workspace apps/api`

### Tests/Checks Run

- Prisma commands were not run because this completion pass did not change the Prisma schema.
- `npm run typecheck --workspace apps/api` failed with `config_error`.
  - Log file: `docs/logs/2026-05-06_phase-4_api-typecheck.log`
  - First failure: unsupported `ignoreDeprecations: "6.0"` in `apps/api/tsconfig.json`.
  - Targeted fix: removed the unsupported suppressor.
  - Rerun result: failed again because the API inherits `NodeNext`/Node16-style module resolution while existing source imports are extensionless across the API.
- Web typecheck, targeted attendance tests, `git diff --check`, production build, full test suite, payroll tests, project tests, and e2e tests were not run after the API typecheck rerun failed, per the stop rule.

### Fixes Applied

- Kept the database enum values unchanged (`leave_paid`, `leave_unpaid`) and mapped them to the requested API/frontend values (`paid_leave`, `unpaid_leave`) to avoid a migration-only enum rename.
- Monthly summary now counts missing employee records as `present` for dates where attendance exists in the selected month/filter.
- Removed unsupported `ignoreDeprecations: "6.0"` from the local API tsconfig during failure handling.

### Remaining TODOs

- Resolve the API-wide TypeScript module resolution mismatch before validation can pass. Options are to set an API-specific module/moduleResolution pair compatible with extensionless TypeScript imports or convert API relative imports to explicit `.js` specifiers consistently.
- Rerun `npm run typecheck --workspace apps/api` after that config decision.
- Run `npm run typecheck --workspace apps/web` after API validation is unblocked or in a follow-up pass.
- Add targeted attendance tests in a later pass if the project adds attendance test files.

## 2026-05-06 - Web TypeScript Config Repair

### Scope

- Fix the web TypeScript `baseUrl` deprecation without upgrading or downgrading TypeScript.
- Keep existing aliases working.
- Do not change business code or add features.

### Failure Classification

- `config_error`

### Root Cause

- `apps/web/tsconfig.json` extends the root `tsconfig.base.json`.
- The root config still used deprecated `compilerOptions.baseUrl`.
- Removing `baseUrl` exposed TypeScript 5.4's requirement that `paths` targets be explicitly relative when no `baseUrl` is set.
- `ignoreDeprecations` in the web config was only suppressing the inherited deprecation and was not needed after the root config fix.

### Changed Files

- `tsconfig.base.json`: Removed deprecated `baseUrl` and changed `@team-platform/shared` path target to `./packages/shared/src/index.ts`.
- `apps/web/tsconfig.json`: Removed `ignoreDeprecations`.
- `docs/logs/2026-05-06_web-tsconfig-error.log`: Captured the first failed typecheck after removing `baseUrl`.
- `docs/IMPLEMENTATION_LOG.md`: Documented this repair.

### Commands Run

- `npm run typecheck --workspace apps/web`

### Result

- First run failed with `TS5090`; log saved to `docs/logs/2026-05-06_web-tsconfig-error.log`.
- After the minimal path target adjustment, `npm run typecheck --workspace apps/web` passed.

### Remaining TODOs

- None for this tsconfig repair.

## 2026-05-05 - Phase 4 Web Build Config Repair

### Scope

- Fix the web dev compile failure at `localhost:3000`.
- Do not continue Phase 4 feature implementation.
- Do not change business logic.

### Failure Classification

- `config_error`

### Failed Command

- `npm run dev --workspace apps/web`
  - Error log: `docs/logs/2026-05-05_phase-4_web-build-error.log`

### Root Cause

- `apps/web/package.json` sets `"type": "module"`.
- `apps/web/postcss.config.js` used CommonJS `module.exports`, so Next/PostCSS loaded it as ESM and failed with `ReferenceError: module is not defined in ES module scope` while compiling `app/globals.css`.
- After that config issue was fixed, web typecheck also exposed config issues:
  - `apps/web/tsconfig.json` had unsupported `ignoreDeprecations: "6.0"` for the installed TypeScript version.
  - The web workspace inherited a base `lib` without DOM types.
  - `experimental.typedRoutes` was enabled while existing navigation hrefs are plain strings.

### Fix Applied

- Renamed `apps/web/postcss.config.js` to `apps/web/postcss.config.cjs`.
- Updated `apps/web/tsconfig.json` to use browser DOM libs and a supported `ignoreDeprecations` value.
- Disabled `experimental.typedRoutes` in `apps/web/next.config.mjs` for the current untyped route strings.

### Commands Run

- `npm run dev --workspace apps/web`
- `npm run typecheck --workspace apps/web`
- Requested `http://localhost:3000` against the running dev server after the fix.

### Verification Results

- `npm run typecheck --workspace apps/web` passed.
- `http://localhost:3000` returned HTTP 200 and rendered the app shell after the config fix.
- Full test suite and production build were not run per repair instructions.

### Remaining TODOs

- Re-enable `experimental.typedRoutes` later only after navigation hrefs are typed or narrowed to route literals.

## 2026-05-05 - Prisma Seed Failure Investigation

### Scope

- Investigate `npx prisma db seed` failure in `apps/api/prisma/seed.ts` inside `seedRolesAndPermissions`.
- Compare seed upsert keys against `Permission`, `Role`, `RolePermission`, `User`, `UserRole`, `DocumentType`, `EmailTemplate`, `TaxSetting`, and `TaxBracket` schema models.
- Do not reset the database, delete migrations, or change schema unless required by a real schema mismatch.

### Root Cause

- The Prisma schema and generated Prisma Client agree with the seed for unique keys:
  - `Permission.code`, `Role.code`, `User.email`, `DocumentType.code`, and `EmailTemplate.code` are unique.
  - `RolePermission` generates `roleId_permissionId` from `@@unique([roleId, permissionId])`.
  - `UserRole` generates `userId_roleId` from `@@unique([userId, roleId])`.
  - `TaxBracket` generates `taxSettingId_level` from `@@unique([taxSettingId, level])`.
- The initial seed failure was not a compound-key mismatch. `seed.ts` did not load `.env` before constructing `PrismaClient`, so Prisma failed with `Environment variable not found: DATABASE_URL`.
- After loading environment files explicitly, the retry reached the database but failed because the connected database does not contain `public.permissions`. That indicates migrations have not been applied to the target database.

### Changed Files Summary

- `apps/api/prisma/seed.ts`: Load root `.env` and `apps/api/.env` before creating `PrismaClient`.
- `docs/logs/2026-05-05_seed-error.log`: Captured initial seed failure output.
- `docs/logs/2026-05-05_seed-error-retry.log`: Captured retry failure output after the seed env fix.
- `docs/IMPLEMENTATION_LOG.md`: Documented the seed investigation, root cause, and verification results.

### Verification Commands

- `npx prisma format`
- `npx prisma validate`
- `npx prisma generate`
- `npx prisma db seed`

### Verification Results

- `npx prisma format` passed.
- `npx prisma validate` passed when `DATABASE_URL` was supplied for the shell.
- `npx prisma generate` passed.
- `npx prisma db seed` failed on retry.
  - Log file: `docs/logs/2026-05-05_seed-error-retry.log`
  - Root cause: The target database is missing the migrated `public.permissions` table.
  - Required next action: Apply existing migrations to the target database, then rerun `npx prisma db seed`.

## 2026-05-05 - Phase 4: Manual Attendance

### Current Phase

Phase 4: Manual Attendance.

### Scope

- Implement manual attendance by date with active employee list defaulting to `present`.
- Save attendance records with only allowed statuses: `present`, `leave_paid`, and `leave_unpaid`.
- Add monthly attendance summaries and attendance month lock/unlock.
- Add RBAC and audit logs for save, lock, and unlock actions.
- Add a basic frontend attendance page for daily roll call, monthly summary, and lock/unlock controls.
- Do not implement payroll, allowances, projects, email automation, import/export, reports, GPS, QR code, or check-in/check-out.

### Assumptions

- Business dates are normalized to UTC midnight from `YYYY-MM-DD` input.
- Month values are stored as `YYYY-MM` strings for attendance locks.
- Saving attendance upserts one record per visible active employee for the selected date, with missing statuses defaulting to `present`.
- Lock/unlock is controlled by `attendance.lock`; save and attendance views require `attendance.manage`.
- Existing local unrelated `apps/api/tsconfig.json`, `apps/web/tsconfig.json`, and `.vscode/` changes remain out of scope.

### Changed Files Summary

- `apps/api/prisma/schema.prisma`: Added `AttendanceLock` model for month locking.
- `apps/api/prisma/migrations/20260505190000_add_attendance_locks/migration.sql`: Added migration SQL for `attendance_locks`.
- `apps/api/src/modules/attendance/*`: Implemented attendance schemas, date helpers, repository, service, and routes for daily attendance, save, monthly summary, lock, and unlock.
- `apps/web/app/attendance/page.tsx`: Added basic attendance page route.
- `apps/web/features/attendance/*`: Added attendance API client and daily/monthly attendance UI.
- `apps/web/types/attendance.ts`: Added attendance response and status types.
- `apps/web/components/layout/app-shell.tsx`: Pointed the Attendance navigation item to `/attendance`.
- `docs/logs/2026-05-05_phase-4_*.log`: Added logs for command failures and inspection output.
- `docs/IMPLEMENTATION_LOG.md`: Finalized the Phase 4 work log.

### Planned Commands

- `npx prisma format`
- `npx prisma validate`
- `npx prisma generate`
- `npm run typecheck --workspace apps/api`
- `npm run typecheck --workspace apps/web`
- Targeted attendance tests only if executable in this environment.
- `git diff --check`

### Commands Run

- `Get-Content -Raw AGENTS.md`
- `Get-Content -Raw docs\IMPLEMENTATION_LOG.md`
- `Get-Content -Raw docs\DECISIONS.md`
- `git status --short --branch`
- `Select-String -Path PLAN.md -Pattern '^## Phase 4' -Context 0,35`
- `Select-String -Path REQUIREMENTS.md -Pattern '^## 3\.' -Context 0,20`
- `Select-String -Path DATABASE.md -Pattern '^## attendance_records$|^## attendance_locks$|^## employees$|^## departments$' -Context 0,30`
- `Select-String -Path API.md -Pattern '^## Attendance$' -Context 0,15`
- `Select-String -Path WORKFLOWS.md -Pattern '^## 2\.' -Context 0,35`
- `Get-Content -Raw apps\api\src\modules\attendance\attendance.routes.ts`
- `Get-ChildItem -Recurse -File apps\web\features\attendance apps\web\app`
- `Get-ChildItem -Recurse -File apps\web\features\attendance,apps\web\app`
- `Select-String -Path apps\api\prisma\schema.prisma -Pattern 'model AttendanceRecord|model AttendanceLock|enum AttendanceStatus|model Employee|model Department' -Context 0,30`
- `Get-Content -Raw apps\api\src\modules\hr\hr.schemas.ts`
- `Get-Content -Raw apps\web\features\hr\hr-api.ts`
- `Get-Content -Raw apps\web\lib\api-client.ts`
- `Get-Content -Raw apps\api\src\modules\employees\employees.repository.ts`
- `npx prisma format`
- `npx prisma validate`
- `npx prisma generate`
- `npm run typecheck --workspace apps/api`
- `npm run typecheck --workspace apps/web`
- `npm run test --workspace apps/api -- attendance`
- `git diff --check`
- `git status --short --branch`
- `git diff --stat`
- `Get-ChildItem -File docs\logs\2026-05-05_phase-4_*`
- `Get-ChildItem -Recurse -File apps\api\docs -ErrorAction SilentlyContinue`

### Tests Run

- `git diff --check` passed.
- `npx prisma format` failed.
  - Log file: `docs/logs/2026-05-05_phase-4_prisma-format.log`
  - Detected error category: `missing_system_tool`
  - Root cause: `npx` is not installed or not available on `PATH`.
  - Attempted fix: Existing `docs/SETUP_TROUBLESHOOTING.md` already documents Node/npm/npx installation steps.
  - Rerun result: Not rerun, because this requires system software setup.
  - Remaining manual action: Install Node.js/npm/npx and rerun Prisma format.
- `npx prisma validate` failed.
  - Log file: `docs/logs/2026-05-05_phase-4_prisma-validate.log`
  - Detected error category: `missing_system_tool`
  - Root cause: `npx` is not installed or not available on `PATH`.
  - Attempted fix: Existing `docs/SETUP_TROUBLESHOOTING.md` already documents Node/npm/npx installation steps.
  - Rerun result: Not rerun, because this requires system software setup.
  - Remaining manual action: Install Node.js/npm/npx and rerun Prisma validate.
- `npx prisma generate` failed.
  - Log file: `docs/logs/2026-05-05_phase-4_prisma-generate.log`
  - Detected error category: `missing_system_tool`
  - Root cause: `npx` is not installed or not available on `PATH`.
  - Attempted fix: Existing `docs/SETUP_TROUBLESHOOTING.md` already documents Node/npm/npx installation steps.
  - Rerun result: Not rerun, because this requires system software setup.
  - Remaining manual action: Install Node.js/npm/npx and rerun Prisma generate.
- `npm run typecheck --workspace apps/api` failed.
  - Log file: `docs/logs/2026-05-05_phase-4_api-typecheck.log`
  - Detected error category: `missing_system_tool`
  - Root cause: `npm` is not installed or not available on `PATH`.
  - Attempted fix: Existing `docs/SETUP_TROUBLESHOOTING.md` already documents Node/npm/npx installation steps.
  - Rerun result: Not rerun, because this requires system software setup.
  - Remaining manual action: Install Node.js/npm and rerun API typecheck.
- `npm run typecheck --workspace apps/web` failed.
  - Log file: `docs/logs/2026-05-05_phase-4_web-typecheck.log`
  - Detected error category: `missing_system_tool`
  - Root cause: `npm` is not installed or not available on `PATH`.
  - Attempted fix: Existing `docs/SETUP_TROUBLESHOOTING.md` already documents Node/npm/npx installation steps.
  - Rerun result: Not rerun, because this requires system software setup.
  - Remaining manual action: Install Node.js/npm and rerun web typecheck.
- `npm run test --workspace apps/api -- attendance` failed.
  - Log file: `docs/logs/2026-05-05_phase-4_targeted-tests.log`
  - Detected error category: `missing_system_tool`
  - Root cause: `npm` is not installed or not available on `PATH`.
  - Attempted fix: Existing `docs/SETUP_TROUBLESHOOTING.md` already documents Node/npm/npx installation steps.
  - Rerun result: Not rerun, because this requires system software setup.
  - Remaining manual action: Install Node.js/npm and rerun targeted attendance tests.
- Initial attendance frontend inspection command failed due an incorrect path expression.
  - Log file: `docs/logs/2026-05-05_phase-4_inspect-web-attendance-initial-failure.log`
  - Detected error category: `unknown`
  - Root cause: Incorrect command path caused PowerShell to resolve a nested non-existent path.
  - Attempted fix: Reran the inspection command with comma-separated literal paths.
  - Rerun result: Succeeded; output saved to `docs/logs/2026-05-05_phase-4_inspect-web-attendance.log`.
- Full test suite, production build, and e2e tests were not run.

### Known TODOs

- Install Node.js/npm/npx and rerun Prisma format/validate/generate, API typecheck, web typecheck, and targeted attendance tests.
- Run the new attendance lock migration before using lock/unlock locally.
- Existing unrelated local `apps/api/tsconfig.json`, `apps/web/tsconfig.json`, and `.vscode/` changes remain unstaged and out of scope.

## 2026-05-05 - Phase 3: Employee, Department, and Position Management

### Current Phase

Phase 3: Employee, Department, and Position Management.

### Scope

- Implement backend CRUD APIs for departments, positions, and employees.
- Add employee salary preview using position salary and salary level.
- Add pagination, search, filtering, validation, RBAC, sensitive employee field masking, and audit logs for Phase 3 entities.
- Add basic frontend pages for listing, creating, editing, and viewing departments, positions, and employees.
- Do not implement attendance, payroll, projects, email, import/export, reports, or unrelated modules.

### Assumptions

- Existing Phase 2 JWT/RBAC middleware remains the authorization foundation.
- Sensitive employee fields are Citizen ID, Citizen ID image URLs, bank fields, salary level, position salary preview data, and dependent count.
- Deletes for Phase 3 are implemented as soft deactivation/status updates, not destructive hard deletes.
- Frontend pages will be simple functional client-side forms and tables, using bearer tokens stored by the existing placeholder client-side session approach for now.

### Changed Files Summary

- `apps/api/src/modules/hr/hr.schemas.ts`: Added shared Zod validation for pagination, department, position, and employee inputs.
- `apps/api/src/modules/hr/hr.utils.ts`: Added pagination helpers, Prisma uniqueness error handling, and sensitive-field permission helpers.
- `apps/api/src/modules/departments/*`: Implemented department list/detail/create/update/deactivate with filtering, validation, RBAC, and audit logs.
- `apps/api/src/modules/positions/*`: Implemented position list/detail/create/update/deactivate with filtering, non-negative salary validation, RBAC, and audit logs.
- `apps/api/src/modules/employees/*`: Implemented employee list/detail/create/update/deactivate, salary preview, sensitive field masking, filtering, validation, RBAC, and audit logs.
- `apps/web/app/departments/*`, `apps/web/app/positions/*`, `apps/web/app/employees/*`: Added basic Phase 3 pages for list/create/edit/detail flows.
- `apps/web/features/hr/*`: Added client-side HR API helpers, forms, list views, detail view, and formatting helpers.
- `apps/web/lib/api-client.ts` and `apps/web/lib/auth.ts`: Added bearer-token API helper and local stored-user permission helpers.
- `apps/web/components/layout/app-shell.tsx`: Added HR navigation links.
- `docs/logs/*.log`: Captured failed command output for unavailable npm commands.
- `docs/SETUP_TROUBLESHOOTING.md`: Documented manual Node/npm setup steps and Docker Compose checks.
- `docs/IMPLEMENTATION_LOG.md`: Finalized the Phase 3 work log.

### Planned Commands

- `npm run typecheck --workspace apps/api`
- `npm run typecheck --workspace apps/web`
- Targeted employee/department/position service tests only if test files/framework execution are available.
- `git diff --check`

### Commands Run

- `Get-Content -Raw AGENTS.md`
- `Get-Content -Raw docs\IMPLEMENTATION_LOG.md`
- `Get-Content -Raw docs\DECISIONS.md`
- `Select-String -Path REQUIREMENTS.md -Pattern '^## 1\.|^## 2\.|^## 12\.|^## 3\.' -Context 0,35`
- `Select-String -Path DATABASE.md -Pattern '^## departments$|^## positions$|^## employees$|^## audit_logs$|^## users$|^## roles$|^## permissions$|^## user_roles$|^## role_permissions$' -Context 0,35`
- `Select-String -Path API.md -Pattern '^## Employees$|^## Departments$|^## Positions$' -Context 0,25`
- `Select-String -Path WORKFLOWS.md -Pattern '^## 1\.|^## 3\.' -Context 0,35`
- `git status --short --branch`
- `Get-Content -Raw apps\api\src\modules\departments\departments.routes.ts`
- `Get-Content -Raw apps\api\src\modules\positions\positions.routes.ts`
- `Get-Content -Raw apps\api\src\modules\employees\employees.routes.ts`
- `Get-Content -Raw apps\api\src\modules\audit\audit.service.ts`
- `Get-Content -Raw apps\api\src\middleware\rbac.ts`
- `Get-Content -Raw apps\web\lib\api-client.ts`
- `Get-Content -Raw apps\web\components\layout\app-shell.tsx`
- `Get-Content -Raw apps\web\app\page.tsx`
- `npm run typecheck --workspace apps/api`
- `npm run typecheck --workspace apps/web`
- `npm run test --workspace apps/api -- employees departments positions`
- `git diff --check`
- `Get-Content -Raw apps\api\package.json | ConvertFrom-Json | Out-Null`
- `Get-Content -Raw apps\web\package.json | ConvertFrom-Json | Out-Null`
- `git diff --stat`

### Tests Run

- `git diff --check` passed.
- `apps/api/package.json` and `apps/web/package.json` parsed successfully.
- `npm run typecheck --workspace apps/api` failed.
  - Log file: `docs/logs/2026-05-05_phase-3_api-typecheck.log`
  - Detected error category: `missing_system_tool`
  - Root cause: `npm` is not installed or not available on `PATH`.
  - Attempted fix: Documented manual Node/npm installation steps in `docs/SETUP_TROUBLESHOOTING.md`.
  - Rerun result: Not rerun, because the error requires system software setup.
  - Remaining manual action: Install Node.js/npm, then rerun the API typecheck.
- `npm run typecheck --workspace apps/web` failed.
  - Log file: `docs/logs/2026-05-05_phase-3_web-typecheck.log`
  - Detected error category: `missing_system_tool`
  - Root cause: `npm` is not installed or not available on `PATH`.
  - Attempted fix: Documented manual Node/npm installation steps in `docs/SETUP_TROUBLESHOOTING.md`.
  - Rerun result: Not rerun, because the error requires system software setup.
  - Remaining manual action: Install Node.js/npm, then rerun the web typecheck.
- `npm run test --workspace apps/api -- employees departments positions` failed.
  - Log file: `docs/logs/2026-05-05_phase-3_targeted-tests.log`
  - Detected error category: `missing_system_tool`
  - Root cause: `npm` is not installed or not available on `PATH`.
  - Attempted fix: Documented manual Node/npm installation steps in `docs/SETUP_TROUBLESHOOTING.md`.
  - Rerun result: Not rerun, because the error requires system software setup.
  - Remaining manual action: Install Node.js/npm, then rerun targeted API tests.
- Full test suite, production build, and e2e tests were not run per phase instructions.

### Fixes Applied

- Added `docs/SETUP_TROUBLESHOOTING.md` after npm-based checks failed due missing system tooling.
- Tightened the employee form so sensitive fields are hidden and not submitted when the stored user lacks `employees.view_sensitive`.

### Known TODOs

- Install Node.js/npm in the local environment and rerun targeted API/web typechecks.
- Run migrations and Prisma seed before manually testing the HR APIs against PostgreSQL.
- Replace the temporary localStorage auth/session approach with the eventual application session flow when the frontend auth phase is implemented.
- Review and stage or discard existing unrelated local `apps/api/tsconfig.json`, `apps/web/tsconfig.json`, and `.vscode/` changes separately; they were left out of the Phase 3 commit.

## 2026-05-05 - Phase 2: Authentication and RBAC Backend

### Current Phase

Phase 2: Authentication and RBAC backend.

### Scope

- Implement JWT login and current-user loading from the database.
- Add bcrypt password hashing/verification helpers.
- Add RBAC middleware for authentication, roles, and permissions.
- Add admin seed user and audit log helper foundation.
- Protect one sample backend route to verify middleware wiring.
- Do not implement employee, payroll, project, or frontend pages.

### Assumptions

- JWT logout remains stateless for this phase because no token blacklist/session table exists yet.
- Existing access-token environment variables remain canonical for backend code; generic JWT variables stay in `.env.example` for compatibility until auth configuration is revisited.
- `bcryptjs` is already installed in the API package and satisfies the bcrypt hashing requirement without adding a new dependency.
- Database migrations are not changed in this phase unless auth schema changes become necessary.

### Changed Files Summary

- `.env.example`: Added admin seed user environment variables.
- `apps/api/prisma/seed.ts`: Added bcrypt-hashed admin seed user, admin role assignment, and admin permission assignment.
- `apps/api/src/config/env.ts`: Added bcrypt and compatibility JWT environment validation.
- `apps/api/src/modules/auth/*`: Replaced placeholder auth with Prisma-backed login, JWT access token creation/verification, request validation, current-user loading, and stateless logout response.
- `apps/api/src/middleware/*`: Added `requireAuth`, `requireRole`, `requirePermission`, and RBAC exports.
- `apps/api/src/modules/audit/audit.service.ts`: Added audit log helper foundation.
- `apps/api/src/utils/app-error.ts`: Added centralized application error class.
- `apps/api/src/modules/users/users.routes.ts`: Protected `GET /api/users` as a sample RBAC route.
- `docs/IMPLEMENTATION_LOG.md`: Finalized the Phase 2 work log.

### Commands Run

- `Get-Content -Raw AGENTS.md`
- `Get-Content -Raw API.md`
- `Get-Content -Raw REQUIREMENTS.md`
- `git status --short --branch`
- `Get-Content -Raw apps\api\src\modules\auth\auth.routes.ts`
- `Get-Content -Raw apps\api\src\modules\auth\auth.schemas.ts`
- `Get-Content -Raw apps\api\src\modules\auth\auth.service.ts`
- `Get-Content -Raw apps\api\src\modules\auth\auth.repository.ts`
- `Get-Content -Raw apps\api\src\middleware\authenticate.ts`
- `Get-Content -Raw apps\api\src\middleware\require-permission.ts`
- `Get-Content -Raw apps\api\src\middleware\error-handler.ts`
- `Get-Content -Raw apps\api\src\app.ts`
- `Get-Content -Raw apps\api\src\config\env.ts`
- `Get-Content -Raw apps\api\src\prisma\client.ts`
- `Get-Content -Raw apps\api\src\routes.ts`
- `Get-Content -Raw apps\api\src\utils\async-handler.ts`
- `Get-Content -Raw apps\api\prisma\seed.ts`
- `Get-Content -Raw apps\api\package.json`
- `Get-Content -Raw apps\api\src\modules\users\users.routes.ts`
- `Get-Content -Raw apps\api\src\modules\roles\roles.routes.ts`
- `Get-Content -Raw docs\IMPLEMENTATION_LOG.md`
- `Get-Content -Raw .env.example`
- `npm run typecheck -w apps/api`
- `npm run test -w apps/api -- --runInBand auth`
- `Get-Content -Raw apps\api\package.json | ConvertFrom-Json | Out-Null`
- `git diff --check`
- `git diff --stat`
- `git diff -- apps/api/src/modules/auth apps/api/src/middleware apps/api/src/modules/audit/audit.service.ts apps/api/prisma/seed.ts apps/api/src/config/env.ts apps/api/src/modules/users/users.routes.ts .env.example docs/IMPLEMENTATION_LOG.md`

### Tests Run

- `apps/api/package.json` parsed successfully.
- `git diff --check` passed.
- `npm run typecheck -w apps/api` was attempted but could not run because `npm` is not installed or not on PATH.
- Targeted auth tests were attempted with `npm run test -w apps/api -- --runInBand auth` but could not run because `npm` is not installed or not on PATH.
- Manual route smoke check was not run because the API dev server requires npm tooling in this environment.
- Full test suite was not run per phase instructions.

### Known TODOs

- Run API typecheck and targeted auth tests in an environment with Node/npm available.
- Run Prisma seed after migrations to create the admin user and RBAC assignments.
- Consider token invalidation/session storage in a later security phase if server-side logout is required.

## 2026-05-05 - Phase 1: Database Foundation

### Current Phase

Phase 1: Database foundation.

### Scope

- Refine the PostgreSQL Prisma schema foundation for auth/RBAC, audit, HR, attendance, payroll, projects, project documents, email, import, and export tables listed for this phase.
- Add seed foundation for roles, permissions, document types, default tax settings, and default email templates.
- Add an initial Prisma migration if local PostgreSQL is available.
- Do not implement frontend pages, business APIs, or module business logic.

### Assumptions

- Month values remain normalized as `YYYY-MM` strings for monthly payroll, lock, import/export, and snapshot-style data.
- File contents remain outside PostgreSQL; the schema stores file URL/path and metadata only.
- Sensitive values such as email SMTP passwords are represented as encrypted text fields, with encryption implementation deferred to a later service phase.
- Existing route placeholders are out of scope except where seed configuration requires package metadata.

### Changed Files Summary

- `apps/api/prisma/schema.prisma`: Refined the PostgreSQL Prisma foundation for Phase 1 table coverage, relations, Decimal fields, Json metadata fields, and common filter indexes.
- `apps/api/prisma/seed.ts`: Added seed foundation for roles, permissions, document types, default tax setting/tax brackets, and default email templates.
- `apps/api/prisma/migrations/20260505173000_init/migration.sql`: Added an initial checked-in migration matching the Phase 1 schema foundation.
- `apps/api/package.json`: Added Prisma seed command configuration.
- `docs/IMPLEMENTATION_LOG.md`: Finalized the Phase 1 work log.

### Commands Run

- `Get-Content -Raw AGENTS.md`
- `Get-Content -Raw DATABASE.md`
- `Get-Content -Raw MAP.md`
- `git status --short --branch`
- `npx prisma format`
- `Test-Path 'C:\Program Files\nodejs\npx.cmd'`
- `docker ps --format "{{.Names}}"`
- `npx prisma validate`
- `npx prisma generate`
- `npx prisma migrate dev --name init`
- `npx prisma db seed`
- `git diff --check -- apps/api/package.json apps/api/prisma/schema.prisma apps/api/prisma/seed.ts apps/api/prisma/migrations/20260505173000_init/migration.sql docs/IMPLEMENTATION_LOG.md`
- `git diff --name-only`
- `Get-Content -Raw apps\api\package.json | ConvertFrom-Json | Out-Null`

### Tests Run

- `git diff --check` passed for changed Phase 1 files.
- `apps/api/package.json` parsed successfully.
- `npx prisma format` was attempted but could not run because `npx` is not installed or not on PATH.
- `npx prisma validate` was attempted but could not run because `npx` is not installed or not on PATH.
- `npx prisma generate` was attempted but could not run because `npx` is not installed or not on PATH.
- `npx prisma migrate dev --name init` was attempted but could not run because `npx` is not installed or not on PATH; Docker is also not installed or not on PATH, so local PostgreSQL availability could not be confirmed.
- `npx prisma db seed` was attempted but could not run because `npx` is not installed or not on PATH.
- Full test suite was not run per phase instructions.

### Known TODOs

- Run Prisma format, validate, generate, migrate, and seed in an environment with Node/npm/npx and local PostgreSQL available.
- Verify the manually checked-in initial migration against Prisma-generated output once Prisma CLI is available.
- Update the pull request summary with migration notes if a writable PR is available.

## 2026-05-05 - Phase 0: Project Audit and Setup Check

### Current Phase

Phase 0: Project audit and setup check.

### Scope

- Audit the current scaffold without implementing business modules.
- Verify monorepo structure, configured stack, Docker services, environment example, README setup instructions, and Prisma foundation.
- Add missing setup documentation/configuration only.

### Assumptions

- This phase is limited to documentation and configuration fixes.
- Dependency install is not needed because this audit can be completed from existing scaffold files.
- Typecheck is configured but not runnable yet because dependencies are not installed and there is no lockfile.
- The current working branch is `scaffold/hrm-system`.

### Changed Files Summary

- `.env.example`: Added the required `JWT_SECRET`, `JWT_EXPIRES_IN`, and `BCRYPT_SALT_ROUNDS` keys while keeping existing access/refresh JWT scaffold variables.
- `docs/DECISIONS.md`: Added setup decisions for monorepo layout, runtime services, environment variable handling, and Phase 0 validation scope.
- `docs/IMPLEMENTATION_LOG.md`: Added and finalized the Phase 0 audit entry.

### Commands Run

- `Get-Content -Raw AGENTS.md`
- `Get-Content -Raw package.json`
- `Get-Content -Raw apps\api\package.json`
- `Get-Content -Raw apps\web\package.json`
- `Get-Content -Raw packages\shared\package.json`
- `Get-Content -Raw docker-compose.yml`
- `Get-Content -Raw .env.example`
- `Get-Content -Raw README.md`
- `Get-ChildItem -Force apps\api\prisma`
- `Get-Content -Raw apps\api\prisma\schema.prisma`
- `Get-Content -Raw apps\api\prisma\seed.ts`
- `Get-ChildItem -Force docs -ErrorAction SilentlyContinue`
- `Test-Path apps\web; Test-Path apps\api; Test-Path packages\shared`
- `git status --short --branch`
- `Get-Content -Raw tsconfig.base.json`
- `Get-Content -Raw docs\IMPLEMENTATION_LOG.md`
- `Test-Path package-lock.json; Test-Path node_modules`
- `git diff -- .env.example docs/DECISIONS.md docs/IMPLEMENTATION_LOG.md`

### Tests Run

- Not run. Phase 0 changed only documentation and `.env.example`; no business modules, shared logic, or Prisma schema changed.
- Typecheck was not run because dependencies are not installed and there is no lockfile yet.

### Known TODOs

- Decide whether auth code should use the generic `JWT_SECRET`/`JWT_EXPIRES_IN` variables or the existing access/refresh token split in a later auth phase.
- Create or update the pull request description if a writable PR is available.

## 2026-05-05 - Phase Preparation

### Current Phase

Phase preparation for future module implementation.

### Scope

- Capture execution rules for upcoming phases.
- Establish the required implementation log before any additional coding work.
- Do not implement application modules in this entry.

### Assumptions

- No feature phase or module scope has been requested yet.
- Only `AGENTS.md` is needed for this preparation step.
- Existing scaffold branch is `scaffold/hrm-system`.

### Changed Files Summary

- `docs/IMPLEMENTATION_LOG.md`: Added the implementation log with the required tracking sections.

### Commands Run

- `Get-Content -Raw AGENTS.md`
- `git status --short --branch`
- `git diff -- docs/IMPLEMENTATION_LOG.md`

### Tests Run

- Not run. No application code, shared infrastructure, Prisma schema, or core logic changed.

### Known TODOs

- Update this log before and after each future implementation phase.
- Run targeted validation for the changed workspace during future phases.
- Update the pull request description after a pull request exists and a phase is completed.
