# Quotation Management Plan

## Module Goals

Quotation Management lets users create project/customer quotations from Inventory materials, calculate one-set and multi-set totals, optionally apply VAT, upload quotation images and a signature image, and export the quotation to Excel.

The MVP should fit current TeamPlatform patterns:

- Express + TypeScript backend module under `/api/quotations`.
- Prisma models using PostgreSQL `Decimal` for money, percentages, and quantities.
- JWT + RBAC permissions.
- Audit logs for state changes and export/download actions.
- Local development file storage with database paths only.
- Excel export through the existing ExcelJS-based export utilities.
- Frontend feature module under `apps/web/features/quotations`.

## Scope

In scope:

- Quotation list, create, edit, detail, deactivate, and Excel export.
- Project selection and project/customer auto-fill when a project is selected.
- Customer name and customer request fields.
- Inventory material search and item selection.
- Snapshot quotation line items.
- One-set subtotal, number-of-sets total, VAT amount, and grand total.
- Multiple quotation images.
- Signature image upload.
- RBAC permissions and audit logs.

Out of scope for MVP:

- PDF export.
- Approval workflow.
- Email sending.
- Drawing/canvas signature capture.
- Project-linked stock reservation or stock out.
- Quotation version comparison.
- Customer master-data module unless added later.

## Entities

### Quotation

Suggested Prisma model: `Quotation`, table `quotations`.

```txt
id
quotationCode unique
projectId nullable
customerName
customerRequest nullable Text
quotationDate DateTime
numberOfSets Decimal
vatEnabled Boolean
vatRate Decimal
subtotalOneSet Decimal
totalBeforeVat Decimal
vatAmount Decimal
grandTotal Decimal
signatureImageUrl nullable Text
status enum draft/sent/accepted/rejected/cancelled
metadata Json nullable
createdById nullable
updatedById nullable
createdAt
updatedAt
deletedAt nullable
```

Project linkage should be optional for MVP. TeamPlatform already has a Project module with customer fields, so project selection should be supported and recommended, but customer-only quotations should remain possible.

### Quotation Item

Suggested Prisma model: `QuotationItem`, table `quotation_items`.

```txt
id
quotationId
lineIndex
materialId nullable
materialCodeSnapshot
materialNameSnapshot
unitSnapshot
quantity Decimal
unitPrice Decimal
amount Decimal
createdAt
updatedAt
```

Use snapshots so historical quotations do not change when Inventory materials are renamed or repriced later.

### Quotation Image

Suggested Prisma model: `QuotationImage`, table `quotation_images`.

```txt
id
quotationId
fileName
fileUrl
fileSize
mimeType
uploadedById nullable
createdAt
```

Store files in local API storage first, for example `apps/api/uploads/quotations/`. Store only URL/path and metadata in PostgreSQL.

### Quotation Export

Suggested Prisma model: `QuotationExport`, table `quotation_exports`, unless the existing `export_logs` table is enough for MVP.

```txt
id
quotationId
exportedById nullable
format
fileName
createdAt
```

MVP recommendation: use existing `ExportLog` for normal export history and add `quotation_exports` only if quotation-specific export history needs direct relation navigation.

## Quotation Code

Quotation code is generated server-side only.

Format:

```txt
Q-YYYYMMDD-XXX
```

Rules:

- Sequence increases per quotation date/day.
- `quotationCode` is unique in the database.
- UI displays the code as read-only.
- Create API should not trust a client-submitted quotation code.
- Server should use the quotation date, or current date if no date is provided yet, to generate the code.
- On duplicate unique conflict, retry code generation once and then return a clear error.

## Material Item Rules

- User searches Inventory by material code or material name.
- Reuse `GET /api/inventory/materials?search=...` for MVP.
- Selecting a material snapshots material ID, material code, material name, unit, and selling price as unit price.
- Unit price defaults to Inventory selling price at the time the item is added.
- Existing quotation items do not auto-update when Inventory selling price changes.
- MVP should allow manual unit price adjustment only if users need price negotiation. If allowed, audit update old/new values.
- `amount = quantity * unitPrice`.
- Quantity must be greater than 0.
- Unit price must be non-negative.
- Display VND and quantities with comma formatting.

## Calculations

```txt
subtotalOneSet = sum(item.amount)
totalBeforeVat = subtotalOneSet * numberOfSets
vatAmount = vatEnabled ? totalBeforeVat * vatRate / 100 : 0
grandTotal = totalBeforeVat + vatAmount
```

Rules:

- `numberOfSets` must be greater than 0.
- `vatRate` defaults to `10`.
- `vatRate` must be non-negative when VAT is enabled.
- Backend recalculates totals from submitted items and ignores client totals for authoritative persistence.
- Frontend calculates live preview using the same formulas.
- Use Decimal-safe conversion on backend and comma-formatted text inputs on frontend.

## Workflows

Create quotation:

```txt
User opens Quotations
-> Click Create Quotation
-> Select project if applicable
-> Project code, project name, and customer fields auto-load when available
-> Enter or confirm customer name
-> Enter customer request
-> Quotation date defaults to today
-> Search Inventory material
-> Add material item
-> Quantity entered per item
-> Unit, material code/name, and unit price auto-fill from Inventory
-> Totals update live
-> Choose VAT option and VAT rate
-> Enter number of sets
-> Upload optional images
-> Upload optional signature image
-> Save
-> Backend generates quotation code and recalculates totals
-> Audit log is created
```

Edit quotation:

```txt
User opens quotation detail
-> Click Edit
-> Update general info, items, images, signature, VAT, or number of sets
-> Save
-> Backend replaces item set transactionally or updates line items consistently
-> Backend recalculates totals
-> Audit log records old/new values
```

Export quotation:

```txt
User opens quotation detail
-> Click Export Excel
-> Backend loads quotation, project, items, images, and signature metadata
-> Backend generates Excel workbook
-> File downloads as quotation-Q-YYYYMMDD-XXX.xlsx
-> Export audit log and export log are created
```

## Excel Export Requirements

Excel file should include:

- Quotation code, quotation date, project code/name if linked, customer name, and customer request.
- Material list: index, material code, material name, quantity, unit, unit price VND, and amount VND.
- Set calculation: subtotal for 1 set, number of sets, total before VAT, VAT option, VAT rate, VAT amount, and grand total.
- Image and signature links for MVP. Embedding images can be a later enhancement if ExcelJS image support is wired safely.

Filename:

```txt
quotation-Q-YYYYMMDD-XXX.xlsx
```

## API Plan

Mount a new backend module under `/api/quotations`.

```txt
GET    /api/quotations
POST   /api/quotations
GET    /api/quotations/:id
PUT    /api/quotations/:id
DELETE /api/quotations/:id
GET    /api/quotations/next-code?date=YYYY-MM-DD
GET    /api/quotations/:id/export/excel
POST   /api/quotations/:id/images
DELETE /api/quotation-images/:id
POST   /api/quotations/:id/signature
```

MVP recommendation: manage items inside the create/update quotation payload so totals can be recalculated transactionally in one service call. Separate item endpoints can be added later for granular inline editing.

## Frontend Plan

Routes:

```txt
/quotations
/quotations/new
/quotations/[id]
/quotations/[id]/edit
```

Feature files:

```txt
apps/web/features/quotations/quotations-api.ts
apps/web/features/quotations/quotations-list-client.tsx
apps/web/features/quotations/quotation-form.tsx
apps/web/features/quotations/quotation-detail-client.tsx
apps/web/features/quotations/quotation-material-selector.tsx
apps/web/features/quotations/quotation-totals-panel.tsx
apps/web/types/quotations.ts
```

## Validation Plan

Required:

- customer name.
- quotation date.
- number of sets greater than 0.
- at least one material item.
- each item quantity greater than 0.
- each item unit price non-negative.
- VAT rate non-negative when VAT is enabled.

Optional:

- project.
- customer request.
- images.
- signature.

## RBAC

Add permissions:

```txt
quotations.view
quotations.manage
quotations.export
quotations.delete
```

Admin gets all quotation permissions. Project Manager, Accountant, or Sales can be granted permissions depending on role setup.

## Audit Logs

Create audit logs for quotation create, update, deactivate/delete, export, image upload/delete, and signature upload/change.

Audit metadata should include quotation ID/code, project ID when linked, customer name, totals, item count, and actor ID.

## Edge Cases

- No project selected: allow customer-only quotation for MVP.
- Project selected but missing customer name: user must enter customer name.
- Inventory material later changes price/name/unit: quotation snapshots remain unchanged.
- Duplicate quotation code under concurrency: database unique constraint and one retry.
- Empty material list: reject save.
- Quantity is empty or zero: reject line item.
- VAT disabled: VAT amount is 0 even if VAT rate is stored.
- Image upload fails after quotation save: keep quotation saved and show upload error, or use separate upload endpoints after save.
- Deleted/deactivated inventory material: existing quotation remains readable through snapshots; new selection should use active materials only.

## Implementation Phases

### Quotation Phase 1: Backend Foundation

- Prisma models and migration.
- Quotation status enum.
- Permissions seed.
- Backend routes, schemas, and services.
- Server-side quotation code generation.
- CRUD with item payload and total recalculation.
- Basic audit logs.

### Quotation Phase 2: Frontend CRUD and Calculations

- Quotation list, create/edit, and detail pages.
- Project selector.
- Inventory material selector.
- Item rows and live totals panel.
- VAT and number-of-sets controls.
- Validation UX.

### Quotation Phase 3: Images, Signature, and Audit Polish

- Local image upload endpoints.
- Signature image upload endpoint.
- Image/signature UI sections.
- Upload audit logs.

### Quotation Phase 4: Excel Export

- Quotation-specific Excel workbook.
- Export endpoint.
- Export log and audit log.
- Download button on detail page.

### Quotation Phase 5: Hardening

- Focused unit tests for code generation and calculations.
- API validation tests.
- Frontend smoke checks.
- Empty-state/error polish.
- Permission visibility checks.
