# Quotation Execution Plan

## Phase 1: Core, Versioning, Preview, Templates, Export

Implemented scope:

- Quotation master records support `commercial` and `project` types.
- Server generates quotation codes with `Q-YYYYMMDD-XXX`, scoped by quotation date.
- First create generates immutable version v1.
- Every update creates a new immutable latest version.
- Quotation version items snapshot inventory material code, name, model, picture URL, unit, unit price, quantity, and amount.
- Built-in web preview is available for current or selected versions.
- Excel templates can be uploaded, mapped with placeholders, set as default, and used for export.
- Excel export falls back to a built-in workbook when no template is configured.
- Company quotation settings feed preview and export headers.
- Approved versions support customer PO upload and one quotation-linked stock out.
- Project quotations can sync items to project materials. Commercial quotations do not sync.

Phase 1 deliberately excludes:

- Drag/drop canvas layout editor.
- Cell-level Excel template designer.
- PDF export.

## Phase 2: Canvas Layout Editor

Recommended next scope:

- Visual section/block editor for quotation layout.
- Drag/drop fields and table columns.
- Preview rendering from the layout schema.
- Export bridge from layout schema to Excel/PDF templates.
