# AGENTS.md

## Project Overview

Build a full web-based company management system covering HR, payroll, project operations, project documents, import/export, reporting, and automated email notifications.

Core modules:

- Employee profile management
- Manual attendance management
- Position, salary grade, allowances, tax, insurance, and payroll
- Project management with plans, tasks, issues, materials, costs, documents, import/export, and statistics
- Automatic email notifications through the company SMTP server
- Role-based access control, document permissions, and audit logs

Primary stack:

- Frontend: Next.js + React + Tailwind CSS + TypeScript
- Backend: Node.js + Express.js + TypeScript
- Database: PostgreSQL 16.x
- ORM: Prisma
- Auth: JWT + RBAC permissions
- File upload: S3-compatible storage, MinIO, Supabase Storage, or local development storage
- Email: Nodemailer + company SMTP server
- Queue: BullMQ + Redis for background email jobs
- Excel: ExcelJS
- PDF: Puppeteer HTML-to-PDF


## PostgreSQL and Prisma Rules

- Use PostgreSQL 16.x as the primary database.
- Prisma datasource provider must be `postgresql`.
- Use `Decimal` for all money, tax, insurance, quantity, and percentage values. Do not use floating point for payroll or finance.
- Use `DateTime` for timestamps and `DateTime` or `Date`-like handling for business dates. Use `DateTime` for timestamps. For business date-only values, use Prisma `DateTime` normalized to start of day or a consistent date-only convention at the service/UI layer.
- Use `@db.Text` for long descriptions, email templates, notes, and audit notes. Use `Json` for structured metadata where useful.
- Use PostgreSQL `Json`/`JsonB` fields only for flexible filters, import/export metadata, and audit old/new values where appropriate.
- Add indexes for foreign keys, codes, month fields, status fields, and frequently filtered report columns.
- Enforce unique business codes where required, such as employee code, position code, project code, document type code, and allowance code.
- Store month values consistently as `YYYY-MM` strings or a normalized first-day-of-month DateTime. Choose one approach and keep it consistent across attendance, payroll, allowances, advances, snapshots, imports, and exports.

## Language and UI

- All documentation, code, table names, API paths, enums, and comments should be written in English.
- The frontend should support Vietnamese UI labels for end users, but implementation names must remain English.
- Use VND currency formatting.
- Date format in the Vietnamese UI should generally be `dd/MM/yyyy`.

## Engineering Rules

- Use TypeScript for both frontend and backend.
- Use strict validation for all API inputs.
- Never store sensitive secrets in plain text.
- SMTP password, Citizen ID images, bank data, and salary/payroll data are sensitive.
- Do not expose Citizen ID, bank account, payroll, or document files unless the current user has permission.
- Every create, update, delete, approve, reject, view, and download action on sensitive data must be logged.
- Prefer configuration tables over hard-coded business rules.
- Payroll, tax, insurance, allowances, email templates, and document permissions must be configurable from Admin screens.
- Lists must support pagination and filters.
- Avoid destructive hard deletes for important business data; use soft delete where appropriate.

## Backend Conventions

Suggested backend structure:

```txt
backend/
  src/
    app.ts
    server.ts
    config/
    prisma/
    modules/
      auth/
      users/
      employees/
      positions/
      attendance/
      allowances/
      payroll/
      tax/
      projects/
      project-documents/
      imports/
      exports/
      email/
      audit/
    middleware/
    utils/
    jobs/
```

Rules:

- Use controllers, services, and repositories where helpful.
- Keep business calculations in service files, not controllers.
- Keep Prisma access in the repository/service layer.
- Use centralized error handling.
- Use Zod or a similar validation library for request bodies, query params, and route params.
- Use environment variables for secrets.
- Add audit logging in services after successful state-changing actions.

## Frontend Conventions

Suggested frontend structure:

```txt
frontend/
  app/
  components/
  features/
    employees/
    attendance/
    payroll/
    projects/
    settings/
  lib/
  services/
  types/
```

Rules:

- Use a clean dashboard-style UI.
- Forms must show validation errors clearly.
- Tables should support search, filter, sorting, and pagination where relevant.
- Sensitive fields should be hidden or masked unless the user has permission.
- Buttons should be hidden or disabled when the user lacks permission.
- Use reusable components for tables, forms, upload controls, status badges, and permission-gated actions.

## Core Business Rules

### Attendance

Attendance is manual, like a web-based roll call.

- HR or Manager chooses a date.
- The system displays active employees.
- Every employee defaults to `present`.
- HR or Manager only marks absences:
  - `leave_paid`: paid leave
  - `leave_unpaid`: unpaid leave
- No late/early logic.
- No check-in/check-out.
- No GPS or QR code requirement.

### Position and Salary Grade

Each position has `base_salary` and `salary_step_amount`. Each employee has `position_id` and `salary_level`.

```txt
position_salary = base_salary + salary_step_amount * salary_level
```

### Allowances

Allowances must be configurable.

```txt
fixed_monthly
per_working_day
attendance_rate
manual_bonus
project_bonus
deduction
```

Each allowance must have `is_taxable` and `is_insurance_based`.

Meal allowance example:

```txt
meal_allowance = 50000 * actual_present_days
```

Diligence allowance example:

```txt
if attendance_percent >= 80 then grant configured amount
```

### Tax and Insurance

Tax and insurance rules must be configurable, including personal deduction, dependent deduction, tax brackets, insurance rates, and effective dates.

### Payroll

Payroll flow:

```txt
Attendance month
-> Allowances, bonuses, project bonuses, advances, and deductions
-> Calculate draft payroll
-> HR reviews
-> Finalize payroll
-> Lock payroll month
-> Publish payslips
-> Optional email notification through SMTP
```

Default net salary formula:

```txt
net_salary = position_salary + total_allowances + total_bonuses - total_deductions - insurance_total - personal_income_tax - salary_advance
```

### Email Automation

Use SMTP settings configured by Admin. Use Nodemailer to send mail. Use BullMQ + Redis for queued jobs. Do not send email directly inside heavy API requests.

Required email triggers:

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

### Project Documents

Document permissions must be configurable by role, document type, security level, and action. Access must be logged.

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

### Import/Export

Import flow:

```txt
Download Excel template
-> Fill data
-> Upload file
-> Validate rows
-> Preview result
-> Confirm import
-> Save to database
-> Create import log
-> Provide error file if validation fails
```

Export flow:

```txt
Choose report type
-> Choose filters
-> Choose format: Excel, CSV, or PDF
-> Generate file
-> Download or send by email
-> Create export log
```

## Quality Expectations

- Add basic unit tests for payroll calculations, tax bracket calculations, permission checks, and import validation.
- Seed initial roles, permissions, document types, email templates, and tax/insurance settings.
- Keep UI and API behavior predictable and permission-safe.
- Prefer clear implementation over over-engineering.
