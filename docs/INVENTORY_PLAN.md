# Inventory Plan

## Goal

Build a complete Inventory / Materials module for managing company stock from master data to stock movements, project usage, import/export, reporting, permissions, and audit logs.

This plan treats inventory as a standalone company-wide stock module that can also connect to project materials. Existing `project_materials` remain project planning/usage records; inventory items represent reusable stock master records.

## Inventory Item Fields

Inventory items must include:

- `materialCode`
- `materialName`
- `category`
- `supplier`
- `purchasePrice`
- `sellingPrice`
- `markupPercentage`
- `stockQuantity`
- `minimumStockQuantity`
- `unit`
- `status`
- `description`

Money, quantity, and percentage fields must use Prisma `Decimal`.

## Database Scope

Add inventory tables without replacing project material tables:

- `inventory_items`
- `inventory_categories`
- `inventory_suppliers`
- `inventory_stock_movements`
- `inventory_stock_adjustments`
- `inventory_reservations`
- `inventory_purchase_receipts`
- `inventory_export_logs` if existing export logs are not enough
- `inventory_import_logs` if existing import logs are not enough

Recommended `inventory_items` fields:

```txt
id
material_code unique
material_name
category_id nullable
supplier_id nullable
purchase_price Decimal
selling_price Decimal
markup_percentage Decimal
stock_quantity Decimal
minimum_stock_quantity Decimal
unit
status active/inactive/discontinued
description Text nullable
metadata Json nullable
created_by_id nullable
updated_by_id nullable
deleted_at nullable
created_at
updated_at
```

Recommended stock movement fields:

```txt
id
inventory_item_id
movement_type receipt/issue/adjustment/return/reservation/release
quantity Decimal
unit_cost Decimal nullable
reference_type nullable
reference_id nullable
project_id nullable
note Text nullable
created_by_id nullable
created_at
```

Rules:

- Do not hard-delete inventory items with movement history.
- Keep stock movements append-only.
- Compute current stock from `inventory_items.stock_quantity`, updated transactionally with movements.
- Add indexes for material code, material name, category, supplier, status, low-stock filters, and movement date.
- Enforce unique `materialCode`.

## Backend API Scope

Inventory API paths:

```txt
GET    /api/inventory/items
POST   /api/inventory/items
GET    /api/inventory/items/:id
PUT    /api/inventory/items/:id
DELETE /api/inventory/items/:id

GET    /api/inventory/categories
POST   /api/inventory/categories
PUT    /api/inventory/categories/:id

GET    /api/inventory/suppliers
POST   /api/inventory/suppliers
PUT    /api/inventory/suppliers/:id

GET    /api/inventory/items/:id/movements
POST   /api/inventory/items/:id/receipts
POST   /api/inventory/items/:id/issues
POST   /api/inventory/items/:id/adjustments

GET    /api/inventory/reports/summary
GET    /api/inventory/reports/low-stock
GET    /api/inventory/reports/movements
```

List APIs must support:

- pagination
- search by `materialCode` and `materialName`
- filters by category, supplier, status, low stock, unit
- sorting by material code, material name, stock quantity, updated date

Validation:

- `materialCode` required, trimmed, unique
- `materialName` required, trimmed, non-empty
- `purchasePrice`, `sellingPrice`, `markupPercentage`, `stockQuantity`, and `minimumStockQuantity` non-negative
- `unit` required
- `status` enum
- stock movement quantity must be positive
- issuing stock must reject insufficient stock unless an admin override is explicitly implemented later

Service rules:

- All stock changes must run in a database transaction.
- Every create, update, delete, receipt, issue, adjustment, import, export, and report download must create an audit log.
- Stock quantity updates must be derived from movement type and quantity.
- If `sellingPrice` is empty and markup is provided, calculate `sellingPrice = purchasePrice + purchasePrice * markupPercentage / 100`.
- If `purchasePrice` and `sellingPrice` are provided, calculate markup percentage for display/reporting where useful.

## Frontend UI Scope

Add an Inventory section to the dashboard navigation.

Pages:

```txt
/inventory
/inventory/items/new
/inventory/items/[id]
/inventory/items/[id]/edit
/inventory/categories
/inventory/suppliers
/inventory/movements
/inventory/reports
```

Inventory item list:

- Material code
- Material name
- Category
- Supplier
- Purchase price
- Selling price
- Markup percentage
- Stock quantity
- Minimum stock quantity
- Unit
- Status
- Actions

List controls:

- search by material code/name
- category filter
- supplier filter
- status filter
- low-stock filter
- pagination
- sorting where existing table patterns support it

Create/edit form:

- material code
- material name
- category
- supplier
- purchase price
- selling price
- markup percentage
- stock quantity
- minimum stock quantity
- unit
- status
- description

Detail page:

- item profile
- current stock summary
- low-stock warning
- price summary
- movement history
- receipt/issue/adjustment actions when permitted
- audit-sensitive actions hidden or disabled without permission

UI labels should be Vietnamese for end users while code names remain English.

## Import / Export Scope

Inventory import types:

- inventory items
- inventory categories
- inventory suppliers
- stock adjustments

Inventory export types:

- inventory item list
- low-stock report
- stock movement report
- inventory valuation report

Import template for inventory items must include:

```txt
materialCode
materialName
category
supplier
purchasePrice
sellingPrice
markupPercentage
stockQuantity
minimumStockQuantity
unit
status
description
```

Import flow must reuse the existing template -> upload -> validate -> preview -> confirm -> log -> error file pattern.

## Permissions

Add inventory permissions:

```txt
inventory.view
inventory.manage
inventory.categories.manage
inventory.suppliers.manage
inventory.adjust_stock
inventory.import
inventory.export
inventory.view_cost
```

Sensitive cost/price fields should be hidden unless the user has `inventory.view_cost`.

## Audit Logging

Audit these actions:

- inventory item create/update/delete
- category create/update
- supplier create/update
- stock receipt
- stock issue
- stock adjustment
- import preview/confirm
- export/download
- viewing cost-sensitive reports

For updates, log old and new values. If `materialName` changes, the audit old/new values must show the name change.

## Reporting

Required inventory reports:

- stock summary
- low-stock items
- stock movements by date range
- inventory valuation by purchase price
- inventory valuation by selling price
- category summary
- supplier summary

Reports should support Excel and CSV first. PDF can use the shared report PDF foundation after inventory data is stable.

## Project Integration

Project material records may optionally reference an `inventoryItemId` later.

Integration rules:

- Project planning can use inventory item data to prefill material code, material name, unit, supplier, and price.
- Issuing inventory to a project should create a stock movement with `referenceType = "project"` and `projectId`.
- Do not merge inventory item records and project material planning records into one table.

## Quality Checks

Targeted checks for the full inventory implementation:

```txt
npx prisma format
npx prisma validate
npx prisma generate
npx prisma migrate dev
npm run typecheck --workspace apps/api
npm run typecheck --workspace apps/web
npm run test --workspace apps/api -- inventory
```

Do not run the full test suite until final hardening.

## Completion Criteria

Inventory is complete when:

- Inventory Prisma models and migration exist.
- Seed data includes baseline permissions and optionally sample categories/suppliers.
- CRUD APIs work for items, categories, and suppliers.
- Stock receipt, issue, and adjustment APIs update stock transactionally.
- List/detail APIs return `materialName` consistently.
- Search supports material code and material name.
- Frontend list, create/edit, detail, movement, and report screens exist.
- Import/export supports inventory item templates and validation.
- Permission checks and audit logs cover sensitive actions.
- Targeted API and web typechecks pass.
- Targeted inventory tests pass.

## Implementation Status - 2026-05-15

Implemented in this pass:

- Prisma models and migration for inventory categories, suppliers, items, and stock movements.
- Inventory item CRUD, category CRUD, supplier CRUD, stock movement, receipt, issue, adjustment, low-stock, movement, and summary APIs.
- Material code and material name search.
- Audit logs for item/category/supplier changes and stock movements.
- Frontend inventory list, create/edit form, detail page, category/supplier pages, movement history, and reports page.
- Inventory import templates and confirmed import mappings for categories, suppliers, items, and stock adjustments.
- Inventory exports for item list and movement history.
- Permission codes and seed role grants.

Remaining extensions:

- Separate reservation and purchase receipt tables can be added later if workflow detail beyond stock movements is required.
- Manual browser smoke testing should be run after applying the migration to a local database.

## List Management Refinement - 2026-05-15

Implemented:

- `/api/inventory/materials` aliases for material list/create/detail/update/deactivate.
- `/api/inventory/materials/bulk-deactivate` and `/api/inventory/materials/bulk-delete` with per-item results.
- Category and supplier deactivate endpoints.
- Separate `inventory.categories.manage` and `inventory.suppliers.manage` permissions.
- Required category and supplier on material create/update.
- Category `department` field.
- Inline material add/edit/deactivate and bulk deactivate on the material list page.
- Category and supplier list pages now support edit and deactivate in place.

## Materials Workspace Refinement - 2026-05-15

Implemented:

- Category/group and supplier management are embedded inside the Materials page as inline panels.
- Material image upload stores local files under API local storage and saves only `imageUrl` on the material record.
- Material tables show image thumbnails when `imageUrl` is available.
- Empty numeric create inputs stay empty and submit as omitted values instead of converting empty strings to `0`.
- Inputs use gray placeholder examples such as `Unit`, `Purchase price`, `Minimum stock`, and `Material name`.

## English UI and Material Code Generation - 2026-05-15

Implemented:

- Inventory Materials page user-facing text is English-only.
- Material Code is read-only in the Material form.
- Material Code is generated by the API from Material Group code plus a 5-digit sequence scoped to that group.
- The UI previews the next Material Code after selecting a Material Group, while the server remains authoritative on create.
- Existing Material Code is kept unchanged when a Material Group is changed on update.

## Pricing and Validation UX - 2026-05-15

Implemented:

- Selling Price is auto-calculated from Purchase Price and Markup % and shown read-only in material forms.
- The backend recalculates Selling Price on create and pricing updates instead of trusting client-submitted values.
- Material number inputs and table values use comma formatting, for example `100,000`.
- Required material fields highlight in red on save with `This field is required.` helper text.
- Optional numeric fields remain empty when there is no value.

## Materials UI and Basic Stock In / Stock Out - 2026-05-15

Implemented:

- Materials form fields are grouped into balanced rows for material identity, pricing, stock levels, and media/description.
- Auto-generated Material Code and auto-calculated Selling Price use gray read-only styling.
- Materials table keeps short values and actions on one line and right-aligns numeric stock/price columns.
- Basic Stock In and Stock Out actions are available from the Materials list when the user has permission.
- Stock In and Stock Out update material stock immediately and write immutable stock movement history with timestamp and user ID.
- The Materials page includes a recent Inventory History section with time, user, material, type, quantity before/after, and note.
