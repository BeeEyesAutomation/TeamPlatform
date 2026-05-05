# Implementation Log

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
