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

## 2026-05-15 - SMTP Password Encryption

SMTP settings continue to support `env:VARIABLE_NAME` password references. Directly submitted SMTP passwords are stored as AES-256-GCM encrypted values in `password_encrypted` using `SMTP_PASSWORD_ENCRYPTION_KEY`, which must be supplied through the environment when encrypting or decrypting stored SMTP passwords.

## 2026-05-15 - Inventory Material Codes

Material Code is generated server-side from the selected Material Group code plus a 5-digit increasing sequence scoped to that Material Group, for example `CK00001` or `DT00001`. `inventory_items.material_code` remains unique in the database, and create retries code generation once if a duplicate is detected.

Material Code is not manually editable in the UI or API create flow. If a material's Material Group changes later, the existing Material Code is kept unchanged for audit safety unless a future requirement explicitly asks for regeneration.

## 2026-05-15 - Inventory Material Pricing

Selling Price is calculated from Purchase Price and Markup % using `purchasePrice * (1 + markupPercentage / 100)`. The backend is authoritative and recalculates Selling Price on create and when Purchase Price or Markup % changes on update; the UI shows Selling Price as a read-only calculated value.

## 2026-05-15 - Inventory Stock Movements

Stock In and Stock Out use immutable `InventoryStockMovement` history records. Stock Out cannot reduce material stock below zero. Future correction, edit, or delete workflows should use reversal movements instead of hard-deleting stock movement history.

Stock Out remains supported in backend history for existing data but is not part of the current Inventory Materials UI workflow. Stock In is batch-based in the Materials page, and batch Stock In is all-or-nothing inside one database transaction.
