# PLAN.md

## Goal

Create a full web-based system for HR, payroll, project management, project documents, email notifications, import/export, and statistics.

## Recommended Tech Stack

```txt
Frontend: Next.js + React + Tailwind CSS + TypeScript
Backend: Node.js + Express.js + TypeScript
Database: PostgreSQL 16.x
ORM: Prisma
Auth: JWT + RBAC
File Storage: S3-compatible storage / MinIO / Supabase Storage / local development storage
Email: Nodemailer + company SMTP server
Queue: BullMQ + Redis
Excel: ExcelJS
PDF: Puppeteer HTML-to-PDF
```


PostgreSQL implementation notes:

- Configure Prisma datasource with `provider = "postgresql"`.
- Use PostgreSQL 16.x in Docker for local development.
- Use Decimal for all payroll and project finance fields.
- Add initial migrations and seed data for roles, permissions, document types, default email templates, tax settings, and allowance examples.

## Phase 1 — Project Foundation

Deliverables:

- Monorepo or separated `frontend` and `backend` folders
- PostgreSQL 16.x + Prisma setup
- Auth module
- User, role, and permission module
- Basic dashboard layout
- Audit log foundation
- Seed data for roles, permissions, document types, and email templates

Core roles:

- Admin
- Director
- HR
- Accountant
- Project Manager
- Team Leader
- Project Employee
- Employee
- Customer/Partner

## Phase 2 — Employee Profile

Deliverables:

- Employee list
- Employee create/edit/detail screens
- Full employee profile fields
- Avatar upload
- Citizen ID front/back image upload
- Bank account information
- Emergency contact information
- Employee status management
- Sensitive field permission checks
- Employee document upload support

Employee fields:

```txt
employee_code
full_name
phone
email
date_of_birth
gender
address
avatar_url
citizen_id_number
citizen_id_issue_date
citizen_id_issue_place
citizen_id_front_image_url
citizen_id_back_image_url
bank_name
bank_account_number
bank_account_holder
bank_branch
department_id
position_id
salary_level
start_date
employment_type
status
emergency_contact_name
emergency_contact_phone
emergency_contact_relation
dependent_count
```

## Phase 3 — Position and Salary Grade

Deliverables:

- Position tab
- Add/edit/delete positions
- Base salary configuration
- Salary step amount configuration
- Employee salary level selection
- Automatic salary preview

Formula:

```txt
position_salary = base_salary + salary_step_amount * salary_level
```

## Phase 4 — Manual Attendance

Deliverables:

- Attendance by date
- Employee list for selected date
- Default `present` status
- Only two absence options: paid leave and unpaid leave
- Save attendance
- Monthly attendance summary
- Lock/unlock attendance month by permission

Out of scope:

- Late/early tracking
- Check-in/check-out
- GPS tracking
- QR code attendance

## Phase 5 — Allowance, Tax, and Insurance Configuration

Deliverables:

- Tax settings tab
- Tax bracket configuration
- Insurance rate configuration
- Allowance types tab
- Allowance rules tab
- Manual monthly bonus/deduction input
- Project bonus input

Allowance calculation types:

```txt
fixed_monthly
per_working_day
attendance_rate
manual_bonus
project_bonus
deduction
```

Each allowance has `is_taxable` and `is_insurance_based`.

Meal allowance example:

```txt
amount = 50000
calculation_type = per_working_day
formula = 50000 * actual_present_days
```

Diligence allowance example:

```txt
if attendance_percent >= 80 then grant configured amount
```

## Phase 6 — Payroll

Deliverables:

- Calculate monthly payroll draft
- Payroll detail per employee
- Insurance calculation
- Personal income tax calculation by configured brackets
- Salary advance and deduction support
- Finalize payroll
- Lock payroll month
- Payslip view for employee
- Export payroll to Excel/PDF
- Optional SMTP notification when payslip is published

Payroll flow:

```txt
Attendance month
-> Allowances, bonuses, and deductions
-> Calculate draft payroll
-> HR review
-> Finalize
-> Lock
-> Publish payslips
-> Email notification
```

## Phase 7 — Email SMTP Automation

Deliverables:

- SMTP settings screen
- Send test email
- Email template management
- Email logs
- Queue-based email sending
- Retry failed emails

Email triggers:

- Task assigned
- Task confirmed
- Task progress updated
- Deadline reminder
- Issue created
- Issue resolved
- Payroll published
- Attendance locked
- Payroll locked
- Project document pending approval

Security:

- Encrypt SMTP password at rest
- Do not include full sensitive salary detail in email by default
- Prefer sending a notification with a login link

## Phase 8 — Project Management Core

Deliverables:

- Project list
- Project detail dashboard
- Project profile
- Customer information
- Contract information
- Plans/phases
- Tasks
- Issues
- Materials
- Purchase requests
- Costs
- Project members
- Project timeline/activity logs

Project statuses:

```txt
planning
in_progress
paused
completed
cancelled
```

Task statuses:

```txt
todo
confirmed
in_progress
pending_review
completed
cancelled
```

Issue statuses:

```txt
new
in_progress
waiting_confirmation
resolved
closed
```

Material statuses:

```txt
not_ordered
purchase_requested
purchasing
received
issued
shortage
cancelled
```

## Phase 9 — Project Documents and Permissions

Deliverables:

- Document type management
- Project document upload
- Versioning
- Security levels
- Approval workflow
- Permission matrix by role and document type
- Access logs for view/download/upload/edit/delete/approve/reject

Document types:

```txt
contract
quotation
drawing
meeting_minutes
acceptance_minutes
handover_minutes
invoice
payment_voucher
site_image
technical_document
other
```

Security levels:

```txt
project_public
internal_company
pm_admin_only
accounting
confidential
client_shared
```

Actions:

```txt
view
upload
edit
delete
download
approve
reject
```


PostgreSQL implementation notes:

- Configure Prisma datasource with `provider = "postgresql"`.
- Use PostgreSQL 16.x in Docker for local development.
- Use Decimal for all payroll and project finance fields.
- Add initial migrations and seed data for roles, permissions, document types, default email templates, tax settings, and allowance examples.

## Phase 10 — Import/Export

Deliverables:

- Download Excel templates
- Import preview and validation
- Import error file
- Import logs
- Export Excel/CSV/PDF
- Export logs

Import types:

- Employees
- Attendance
- Allowances, bonuses, and deductions
- Projects
- Project plans
- Project tasks
- Project issues
- Project materials
- Project costs

Export types:

- Employee list
- Attendance summary
- Payroll
- Project list
- Full project report
- Project progress
- Project costs
- Project issues
- Project materials
- Employee project performance


PostgreSQL implementation notes:

- Configure Prisma datasource with `provider = "postgresql"`.
- Use PostgreSQL 16.x in Docker for local development.
- Use Decimal for all payroll and project finance fields.
- Add initial migrations and seed data for roles, permissions, document types, default email templates, tax settings, and allowance examples.

## Phase 11 — Project Statistics and Dashboards

Deliverables:

- Global project dashboard
- Per-project dashboard
- Status statistics
- Progress statistics
- Cost statistics
- Issue statistics
- Material statistics
- Employee performance statistics
- Monthly statistics snapshots

Dashboard metrics:

```txt
total_projects
active_projects
completed_projects
overdue_projects
paused_projects
cancelled_projects
total_estimated_budget
total_actual_cost
budget_variance
total_tasks
completed_tasks
overdue_tasks
open_issues
critical_issues
material_shortages
pending_purchase_requests
```

## Suggested Implementation Order

1. Auth, RBAC, and database foundation
2. Employee profiles
3. Positions and salary grades
4. Attendance
5. Allowance, tax, and insurance settings
6. Payroll
7. SMTP, email templates, and email logs
8. Project core
9. Project documents and permissions
10. Import/export
11. Statistics dashboards
12. Polish, tests, and security review
