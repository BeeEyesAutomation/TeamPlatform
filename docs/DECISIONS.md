# Decisions

## 2026-05-05 - Phase 0 Setup Decisions

### Monorepo Layout

Use an npm workspace monorepo with:

- `apps/web` for the Next.js frontend.
- `apps/api` for the Express API and Prisma schema.
- `packages/shared` for shared TypeScript types, constants, and permissions.

### Runtime Services

Use Docker Compose for local PostgreSQL 16.x and Redis services.

### Environment Variables

Keep the existing access/refresh JWT variables for the scaffold and also include generic `JWT_SECRET` and `JWT_EXPIRES_IN` keys required by Phase 0. The auth implementation phase should choose one canonical token configuration and remove duplication if appropriate.

### Validation Scope

Phase 0 is an audit and setup check only. Do not implement business modules or run the full test suite.

## 2026-05-06 - Implementation Decisions Through Phase 11

### Month Values

Use `YYYY-MM` strings for payroll and attendance-month APIs. Business date-only inputs are normalized at the service/API boundary.

### Attendance Defaults

Manual attendance treats missing employee records on saved attendance dates as `present`.

### Project Timeline

Project timeline uses `audit_logs` entries with project metadata instead of a dedicated project activity table because the current Prisma schema does not include a separate activity-log model.

### Project Documents

Document reject authorization uses `canApprove` because the current `document_permissions` model has no separate `can_reject` field.

### SMTP Passwords

SMTP settings support direct stored placeholders or `env:VARIABLE_NAME` references in `password_encrypted`. A stronger encryption/key-management approach remains future work.

### Import Foundation

Phase 10 stores import preview rows and row errors in `ImportLog.metadata`. Excel template generation and error workbook generation are implemented; multipart Excel upload parsing is deferred.
