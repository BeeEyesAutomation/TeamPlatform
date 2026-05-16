# MAP.md

## System Map

```txt
Company Management System
├── Auth & RBAC
├── Employee Management
│   ├── Employee profiles
│   ├── Citizen ID images
│   ├── Bank information
│   ├── Emergency contacts
│   └── Employee documents
├── Position & Salary Grade
│   ├── Positions
│   ├── Base salary
│   ├── Salary step amount
│   └── Employee salary level
├── Attendance
│   ├── Manual daily attendance
│   ├── Paid leave
│   ├── Unpaid leave
│   ├── Monthly summary
│   └── Attendance lock
├── Payroll
│   ├── Allowances
│   ├── Bonuses
│   ├── Project bonuses
│   ├── Deductions
│   ├── Salary advances
│   ├── Insurance
│   ├── Personal income tax
│   ├── Payslips
│   └── Payroll lock
├── Email Automation
│   ├── SMTP settings
│   ├── Email templates
│   ├── Email queue
│   └── Email logs
├── Project Management
│   ├── Project profile
│   ├── Customer info
│   ├── Contract info
│   ├── Plans/phases
│   ├── Tasks
│   ├── Issues
│   ├── Materials
│   ├── Purchase requests
│   ├── Costs
│   ├── Members
│   ├── Documents
│   └── Timeline
├── Project Document Permissions
│   ├── Document types
│   ├── Security levels
│   ├── Role permissions
│   ├── Approval workflow
│   └── Access logs
├── Import/Export
│   ├── Excel templates
│   ├── Import validation
│   ├── Import logs
│   ├── Export Excel
│   ├── Export CSV
│   ├── Export PDF
│   └── Export logs
└── Statistics
    ├── HR dashboard
    ├── Payroll dashboard
    ├── Project dashboard
    ├── Project cost statistics
    ├── Issue statistics
    ├── Material statistics
    └── Employee performance statistics
```

## Suggested Navigation

```txt
Dashboard
Employees
Attendance
Payroll
  ├── Payroll Runs
  ├── Allowance Settings
  ├── Tax & Insurance Settings
  └── Salary Advances
Positions
Projects
  ├── Project List
  ├── Project Dashboard
  ├── Plans
  ├── Tasks
  ├── Issues
  ├── Materials
  ├── Purchase Requests
  ├── Costs
  ├── Documents
  └── Statistics
Reports
Import/Export
Settings
  ├── Users
  ├── Roles & Permissions
  ├── Email SMTP
  ├── Email Templates
  ├── Document Types
  └── Document Permissions
Audit Logs
```

## Data Flow Map

```txt
Employee Profile
-> Position and Salary Level
-> Attendance
-> Allowances and Bonuses
-> Tax and Insurance Settings
-> Payroll Calculation
-> Payslip Publication
-> Optional Email Notification
```

```txt
Project Profile
-> Project Plan
-> Project Tasks
-> Task Confirmation
-> Progress Updates
-> Issues and Materials
-> Costs
-> Documents
-> Dashboard Statistics
-> Export Reports
```

```txt
Document Upload
-> Permission Check
-> Security Level Check
-> Optional Approval
-> Access Logs
-> Download/View Permission Check
```
## Quotation Module Map

Implemented backend:

```txt
/api/quotations                                      Quotation CRUD, versions, preview, Excel export, approval, PO upload, stock out
/api/quotation-templates                             Excel template upload, placeholder mapping, default template management
/api/quotation-template-versions                     Canvas layout JSON, material table config, duplicate/restore template versions
/api/quotation-settings                              Company quotation settings for preview/export
/api/quotation-template-versions                     Quotation template version layout/table APIs
apps/api/src/modules/quotations/                     routes, schemas, service, calculations, Excel builder
```

Implemented frontend:

```txt
/quotations                                          Quotation list
/quotations/new                                      Create quotation
/quotations/:id                                      Detail, versions, preview, approval actions, PO upload, stock out, export
/quotations/:id/edit                                 Edit quotation and create a new latest version
/quotations/templates                                Excel template manager
/quotations/settings                                 Company quotation settings
apps/web/features/quotations/                        API wrapper, list, form, detail, template/settings clients
apps/web/features/quotations/quotation-canvas-editor.tsx  Canvas template layout editor
apps/web/features/quotations/quotation-layout-preview.tsx  Layout-config web preview renderer
apps/web/types/quotations.ts                         Quotation frontend types
```

Phase 1 data flow:

```txt
Quotation
-> Choose Commercial or Project type
-> Project quotation requires project
-> Search Inventory materials
-> Snapshot material code, name, model, picture, unit, and selling price
-> Calculate version totals
-> Preview selected immutable version
-> Export Excel from uploaded template or built-in default
-> Approve version
-> Upload customer PO
-> Create one all-or-nothing stock out for approved version
```
