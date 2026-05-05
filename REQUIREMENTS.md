# REQUIREMENTS.md

## 1. Employee Management

The system must manage full employee profiles.

Required fields:

- Employee code
- Full name
- Phone number
- Email
- Date of birth
- Gender
- Address
- Avatar image
- Citizen ID number
- Citizen ID issue date
- Citizen ID issue place
- Citizen ID front image
- Citizen ID back image
- Bank name
- Bank account number
- Bank account holder
- Bank branch
- Department
- Position
- Salary level
- Start date
- Employment type
- Status
- Emergency contact name
- Emergency contact phone
- Emergency contact relationship
- Dependent count for tax calculation

Employee statuses:

- probation
- active
- temporarily_inactive
- resigned

Employment types:

- official
- probation
- seasonal
- part_time

## 2. Position and Salary Grade

The position module must be separate. Each position has name, description, base salary, salary step amount, and status. Each employee has a salary level.

```txt
position_salary = base_salary + salary_step_amount * salary_level
```

## 3. Manual Attendance

Attendance must be simple and manual.

- HR/Manager selects a date.
- The system displays all active employees.
- Default is `present`.
- Only two absence states: `leave_paid` and `leave_unpaid`.
- Present is implied if neither absence type is selected.
- No late/early tracking.
- No check-in/check-out.
- No GPS.
- No QR code.

Monthly summary must calculate working days, present days, paid leave days, and unpaid leave days.

## 4. Allowances and Bonuses

The system must allow dynamic configuration of allowances.

Calculation types:

- fixed monthly
- per working day
- attendance rate
- manual bonus
- project bonus
- deduction

Each allowance must support name, code, amount, unit, calculation type, taxable flag, insurance-based flag, apply scope, and status.

Apply scopes:

- company
- department
- position
- employee

Meal allowance example: `50,000 VND per actual present day`.

Diligence allowance example: `If attendance percent >= 80%, the employee receives the configured amount.`

## 5. Tax and Insurance

The system must support configurable tax and insurance.

Tax settings include personal deduction, dependent deduction, effective date, and status. Insurance settings include social insurance rate, health insurance rate, unemployment insurance rate, effective date, and status. Tax brackets include level, income from, income to, and rate.

Tax calculation must be bracket-based and configurable.

## 6. Payroll

Payroll must calculate position salary, allowances, bonuses, project bonuses, deductions, insurance, taxable income, personal income tax, salary advance, and net salary.

Payroll must support draft calculation, recalculation, finalization, month lock, payslip view, Excel export, PDF export, and email notification.

## 7. Email Automation

The system must send email through the company SMTP server. SMTP settings include host, port, username, encrypted password, from email, from name, encryption type, and active status.

Required email templates:

- Task assigned
- Task confirmed
- Task progress updated
- Task deadline reminder
- Issue created
- Issue resolved
- Payroll published
- Project document pending approval

System must log email status: pending, sent, failed, and retrying.

## 8. Project Management

The project module must include project profile, customer information, contract information, plans/phases, tasks, issues, materials, purchase requests, costs, members, documents, timeline/activity logs, and statistics.

## 9. Project Documents

Document types:

- Contract
- Quotation
- Drawing
- Meeting minutes
- Acceptance minutes
- Handover minutes
- Invoice
- Payment voucher
- Site image
- Technical document
- Other

Each document has project, type, title, file, version, security level, status, uploaded by, approved by, and notes.

Actions: view, upload, edit, delete, download, approve, and reject. Permissions must be configurable by role, document type, and security level.

## 10. Import/Export

Import must support template download, Excel upload, row validation, preview, confirm import, error file download, and import logs.

Export must support Excel, CSV, PDF, filters, and export logs.

## 11. Statistics

Statistics must include project status summary, project progress summary, project cost summary, issue summary, material summary, employee project performance, and monthly snapshots.

## 12. Security

Required:

- RBAC
- Audit logs
- Sensitive data masking
- Permission-checked file download
- Password hashing
- Secret environment variables
- Encrypted SMTP password
- Optional encryption for Citizen ID and bank data
