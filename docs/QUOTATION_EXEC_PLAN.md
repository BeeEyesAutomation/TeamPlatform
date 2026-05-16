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

Implemented scope:

- Visual section/block editor for quotation layout.
- JSON-backed layout blocks with position, size, layer, visibility, lock state, binding, and style configuration.
- Properties panel for content, placeholder binding, alignment, colors, size, position, duplicate, hide/show, lock/unlock, and delete actions.
- Material table column editor for visibility, labels, order, width, alignment, and custom columns.
- Template version records with immutable version numbers, duplicate, restore/set-default, and default-version selection.
- Preview rendering from `layoutConfig` and `tableConfig`, with fallback to the built-in Phase 1 preview.
- Excel export continues to use uploaded template placeholder mapping; table configuration informs the built-in workbook fallback where practical.

Phase 2 deliberately excludes:

- Full Excel cell-level designer.
- Exact canvas-to-Excel positioning.
- PDF export.
