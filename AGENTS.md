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

## Token and Context Optimization Rules

### 1. Read only what is necessary

- Always read AGENTS.md first.
- Then read docs/IMPLEMENTATION_LOG.md and docs/DECISIONS.md if they exist.
- For each task, read only the documentation sections directly related to the current phase.
- Do not load unrelated large files.
- Do not inspect frontend files when the task is backend-only.
- Do not inspect backend files when the task is frontend-only, unless API contracts are needed.
- Do not read generated files, build output, node_modules, .next, dist, coverage, or migration SQL files unless specifically debugging them.

### 2. Use implementation logs as memory

- Before starting, check docs/IMPLEMENTATION_LOG.md to understand completed phases and known issues.
- Do not rediscover completed work by scanning the entire repo.
- Update docs/IMPLEMENTATION_LOG.md at the end of each task with:
  - phase/task name
  - files changed
  - commands run
  - errors found
  - fixes applied
  - remaining TODOs
- Use docs/DECISIONS.md for long-term technical decisions.

### 3. Keep scope narrow

- Only implement the requested phase or task.
- Do not opportunistically refactor unrelated modules.
- Do not implement future phase features early.
- If a dependency or schema change is needed outside the phase, document the reason before changing it.
- Prefer small, targeted changes over broad rewrites.

### 4. Avoid large responses

- Do not paste full files into responses.
- Summarize changes instead of printing large code blocks.
- Show only the exact command outputs that matter.
- If a file is large, mention the file path and summarize the relevant section.
- Return concise status updates:
  - completed
  - changed files
  - commands run
  - issues
  - next step

### 5. Search efficiently

- Prefer targeted search terms.
- Search by exact symbol, route, model, or file name.
- Do not perform broad repo-wide searches unless necessary.
- Stop searching once the needed file or symbol is found.

### 6. Test efficiently

- Do not run the full test suite except in final hardening phase.
- Run only targeted checks for changed code.
- Prefer:
  - npm run typecheck --workspace apps/api
  - npm run typecheck --workspace apps/web
  - npx prisma validate
  - npx prisma generate
  - targeted unit tests
- If a command fails, save logs and retry at most once after a targeted fix.

### 7. Failure handling

- If a command fails, save output under docs/logs/.
- Classify the error as:
  - missing_dependency
  - missing_system_tool
  - database_not_running
  - redis_not_running
  - env_missing
  - migration_error
  - type_error
  - lint_error
  - test_assertion_error
  - config_error
  - unknown
- Fix only the smallest related issue.
- If system-level setup is missing, do not install OS tools automatically. Document manual steps in docs/SETUP_TROUBLESHOOTING.md.
- If an npm dependency is clearly missing, install it only in the correct workspace and commit package.json plus lockfile.

### 8. Database and Prisma efficiency

- Do not reset the database unless explicitly instructed.
- Do not delete migrations unless explicitly instructed.
- When Prisma changes are needed, run only:
  - npx prisma format
  - npx prisma validate
  - npx prisma generate
  - npx prisma migrate dev only when schema changes are intentional
- Do not inspect all migrations unless debugging migration history.

### 9. Frontend efficiency

- Do not run production build during feature phases unless necessary.
- Fix config errors locally and minimally.
- For TypeScript path/config issues, inspect only:
  - apps/web/tsconfig.json
  - apps/web/package.json
  - apps/web/next.config.*
  - apps/web/postcss.config.*
  - apps/web/tailwind.config.*

### 10. Backend efficiency

- For API work, inspect only:
  - relevant route
  - relevant controller/service
  - relevant validation schema
  - relevant Prisma model
  - relevant middleware
- Do not scan all modules unless shared infrastructure is affected.

### 11. Commit discipline

- Make small logical commits.
- Commit documentation/log updates with the related fix.
- Do not mix unrelated phase changes in one commit.
- Commit messages should be short and specific.

### 12. Response format

At the end of each task, respond using this format only:

Summary:
- ...

Changed files:
- ...

Commands run:
- ...

Result:
- ...

Issues / TODO:
- ...

Next recommended step:
- ...

Do not include large code dumps unless explicitly requested.
