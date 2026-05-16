# WORKFLOWS.md

## 1. Employee Profile Workflow

```txt
HR/Admin opens Employee Management
-> Create employee
-> Enter personal information
-> Upload avatar
-> Enter Citizen ID information
-> Upload Citizen ID front/back images
-> Enter bank account information
-> Assign department
-> Assign position
-> Enter salary level
-> Enter dependent count
-> Save employee profile
-> Create user account if needed
-> Create audit log
```

Permission rules:

- Only permitted roles can view Citizen ID, bank, and salary fields.
- Sensitive fields should be masked by default.
- Every create/update/delete/view of sensitive data must create an audit log.

## 2. Manual Attendance Workflow

```txt
HR/Manager opens Attendance
-> Select date
-> Optionally filter by department
-> System displays active employees
-> All employees default to present
-> HR/Manager only marks absent employees
   -> Paid leave = leave_paid
   -> Unpaid leave = leave_unpaid
-> Save attendance
-> System stores records
-> Create audit log
```

Monthly attendance summary:

```txt
working_days
present_days
paid_leave_days
unpaid_leave_days
attendance_percent
```

Month lock workflow:

```txt
HR reviews attendance month
-> HR locks attendance month
-> System prevents further edits
-> Admin can unlock if necessary
-> Create audit log
```

## 3. Position and Salary Workflow

```txt
Admin opens Position Settings
-> Create or edit position
-> Enter base salary
-> Enter salary step amount
-> Save
```

Employee salary calculation:

```txt
position_salary = base_salary + salary_step_amount * salary_level
```

When position or salary level changes, create an audit log.

## 4. Allowance Configuration Workflow

```txt
Admin/Accountant opens Allowance Settings
-> Create allowance type
-> Select calculation type
-> Enter amount
-> Select unit
-> Choose taxable flag
-> Choose insurance-based flag
-> Choose apply scope
-> Save
```

Supported calculation types:

```txt
fixed_monthly
per_working_day
attendance_rate
manual_bonus
project_bonus
deduction
```

Meal allowance example:

```txt
amount = 50000
calculation_type = per_working_day
result = 50000 * actual_present_days
```

Diligence allowance example:

```txt
if attendance_percent >= configured_min_percent then grant configured amount
```

## 5. Payroll Workflow

```txt
HR/Accountant opens Payroll
-> Select month
-> System reads attendance summary
-> System reads position salary
-> System calculates configured allowances
-> System adds manual bonuses and project bonuses
-> System subtracts deductions and salary advances
-> System calculates insurance
-> System calculates personal income tax by configured tax brackets
-> System creates draft payroll
-> HR reviews each employee payroll
-> HR finalizes payroll
-> HR publishes payslips
-> Optional SMTP email notification is queued
-> HR locks payroll month
```

Payroll formula:

```txt
net_salary = position_salary + total_allowances + total_bonuses - total_deductions - insurance_total - personal_income_tax - salary_advance
```

Payslip should show:

```txt
position_salary
meal_allowance
diligence_allowance
transport_allowance
project_bonus
manual_bonus
deductions
social_insurance
health_insurance
unemployment_insurance
personal_income_tax
salary_advance
net_salary
```

## 6. SMTP Email Workflow

```txt
Admin opens Email Settings
-> Enter SMTP host, port, username, encrypted password, from email, from name, and encryption type
-> Send test email
-> Save settings
```

Email job workflow:

```txt
Business event occurs
-> System creates email job
-> Job enters BullMQ queue
-> Worker sends email through Nodemailer and SMTP
-> System records email log
-> If failed, retry based on retry policy
```

Required triggers:

```txt
task_assigned
task_confirmed
task_progress_updated
task_deadline_reminder
issue_created
issue_resolved
payroll_published
document_pending_approval
```

## 7. Project Workflow

```txt
Project Manager creates project
-> Enter project profile
-> Enter customer information
-> Enter contract information
-> Create plans/phases
-> Assign project members
-> Create tasks
-> System sends task assignment emails
-> Employee confirms task
-> Employee updates progress
-> Manager reviews progress
-> Issues are created if problems occur
-> Materials and purchase requests are tracked
-> Costs are updated
-> Documents are uploaded and approved as needed
-> Dashboard and statistics update
-> Project is completed and closed
```

## 8. Task Workflow

```txt
Manager creates task
-> Assign employee
-> Set deadline and priority
-> System sends task assignment email
-> Employee confirms task
-> Employee updates progress
-> Employee submits for review
-> Manager approves completion or returns task
-> System records timeline activity
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

## 9. Issue Workflow

```txt
User creates issue
-> Select project and optional task
-> Enter title and description
-> Select severity
-> Assign handler
-> Set deadline
-> System sends issue email
-> Handler updates root cause and solution
-> Handler marks resolved
-> Manager confirms and closes issue
```

Issue statuses:

```txt
new
in_progress
waiting_confirmation
resolved
closed
```

## 10. Material and Purchase Request Workflow

```txt
Project team adds planned materials
-> Update used quantity
-> System calculates remaining quantity
-> If shortage occurs, create purchase request
-> Manager approves or rejects purchase request
-> Purchasing processes request
-> Mark material as received
-> Update material stock/status
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

## 11. Project Document Workflow

```txt
User opens project documents
-> Select document type
-> Upload file
-> Enter title, version, security level, and note
-> System checks upload permission
-> If approval is required, status becomes pending_approval
-> Approver receives notification
-> Approver approves or rejects
-> System logs every action
```

Document access check:

```txt
user role
+ project membership
+ document type
+ security level
+ requested action
= allow or deny
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

## 12. Import Workflow

```txt
User opens Import/Export
-> Download Excel template
-> Fill data
-> Upload Excel file
-> System validates rows
-> System displays preview
-> System displays errors if any
-> User confirms import
-> System saves valid rows
-> System creates import log
-> System provides error file when validation fails
```

Supported imports:

```txt
employees
attendance
allowances
projects
project_plans
project_tasks
project_issues
project_materials
project_costs
```

## 13. Export Workflow

```txt
User selects export type
-> Select filters
-> Select format: Excel, CSV, or PDF
-> System generates file
-> User downloads file or sends it by email
-> System creates export log
```

Supported exports:

```txt
employees
attendance_summary
payroll
projects
project_full_report
project_progress
project_costs
project_issues
project_materials
project_performance
```

## 14. Statistics Workflow

```txt
System aggregates project data
-> Calculate status counts
-> Calculate progress metrics
-> Calculate cost variance
-> Calculate task and issue summaries
-> Calculate material shortages
-> Calculate employee project performance
-> Store monthly snapshot if configured
-> Display dashboard charts and tables
```

Recommended dashboards:

- HR dashboard
- Payroll dashboard
- Global project dashboard
- Per-project dashboard
- Issue dashboard
- Material dashboard
- Cost dashboard
- Employee performance dashboard

## 15. Quotation Workflow

Create quotation:

```txt
User opens Quotation Management
-> Create quotation
-> Select quotation type: Commercial or Project
-> Select project if quotation type is Project
-> Project code, project name, and customer data auto-load when available
-> Enter or confirm customer name
-> Enter customer request
-> Quotation date defaults to today
-> Search and select Inventory materials
-> Material code, material name, unit, and selling price auto-load
-> Enter quantity for each item
-> System calculates item amount
-> Enter number of sets
-> Choose No VAT or Include VAT
-> System calculates subtotal for 1 set, total before VAT, VAT amount, and grand total
-> Upload optional quotation images
-> Upload optional signature image
-> Save
-> Backend generates quotation code
-> Backend creates quotation master and immutable version v1
-> Backend snapshots material fields and recalculates totals
-> Create audit log
```

Edit quotation:

```txt
User opens quotation detail
-> Edit quotation
-> Update header, items, images, signature, VAT, or number of sets
-> Save
-> Backend creates a new immutable latest version
-> Backend recalculates totals
-> Create audit log with old/new values
```

Preview and version history:

```txt
User opens quotation detail
-> Select current or older version
-> Built-in web preview renders company header, quotation info, material table, totals, VAT, and version number
-> Export and approval actions use the selected version
```

Export quotation:

```txt
User opens quotation detail
-> Select version if needed
-> Export Excel
-> Backend uses the default uploaded Excel template when available or built-in layout otherwise
-> Backend replaces single-value placeholders and item placeholders
-> Backend generates quotation-Q-YYYYMMDD-XXX.xlsx
-> Create export log and audit log
```

Approve quotation and create stock out:

```txt
User opens an approved quotation version
-> Upload customer PO if available
-> Create Stock Out
-> Backend validates available stock for every item using quantity * numberOfSets
-> Backend updates inventory and creates stock movement history in one transaction
-> Backend blocks duplicate stock out for the same approved quotation version
```

Template and settings management:

```txt
User opens Quotation Templates
-> Upload .xlsx template
-> Edit placeholder mapping JSON
-> Set default template

User opens Company Quotation Settings
-> Maintain company header, tax code, contact, and bank details
-> Preview and Excel export use these settings
```
