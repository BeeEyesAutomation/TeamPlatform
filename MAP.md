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
