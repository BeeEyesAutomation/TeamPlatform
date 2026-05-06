# Implementation Log

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
