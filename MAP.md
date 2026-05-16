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
/api/quotations                   Quotation list/create/detail/update/deactivate
/api/quotations/:id/images        Quotation image upload
/api/quotations/:id/signature     Signature image upload
/api/quotations/:id/export/excel  Quotation Excel export
apps/api/src/modules/quotations/  routes, schemas, service, Excel builder
```

Implemented frontend:

```txt
/quotations                       Quotation list
/quotations/new                   Create quotation
/quotations/:id                   Quotation detail and Excel export
/quotations/:id/edit              Edit quotation
apps/web/features/quotations/     API wrapper, list, form, detail, item selector, totals panel
apps/web/types/quotations.ts      Quotation frontend types
```

Planned data flow:

```txt
Quotation
-> Select project or enter customer directly
-> Search Inventory materials
-> Snapshot material code, name, unit, and selling price
-> Calculate one-set subtotal, total before VAT, VAT amount, and grand total
-> Upload quotation images and signature image
-> Export quotation Excel file
-> Write audit and export logs
```
