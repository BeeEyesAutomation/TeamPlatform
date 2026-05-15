# DATABASE.md

## Main Tables

This file describes the expected database model. Codex should convert this into Prisma models.

## Database Engine

Use **PostgreSQL 16.x** with **Prisma ORM**. Codex should generate Prisma models with:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Recommended PostgreSQL notes:

- Use `Decimal` for VND money, tax, insurance, percentage, unit price, quantity, budget, and cost values.
- Use `String @db.VarChar(255)` for business codes and indexed short text fields when needed.
- Use `String @db.Text` for long text fields such as descriptions, notes, email bodies, error messages, and audit metadata.
- Use `Json` for flexible values such as export filters, import row errors, audit `old_value`/`new_value`, and configurable metadata.
- Prefer PostgreSQL JSONB behavior where Prisma supports it through `Json` fields and application-level indexing decisions.
- Add indexes to `created_at`, `status`, `month`, foreign keys, and frequently filtered report fields.
- Prefer soft delete fields such as `deleted_at` for important business records.
- Store file contents in object storage or local development storage. Store only URLs/paths and metadata in PostgreSQL.


## users

```txt
id
email
password_hash
full_name
employee_id nullable
is_active
last_login_at
created_at
updated_at
```

## roles

```txt
id
code
name
department
description
status
created_at
updated_at
```

## permissions

```txt
id
code
name
description
```

## role_permissions

```txt
id
role_id
permission_id
```

## user_roles

```txt
id
user_id
role_id
```

## departments

```txt
id
name
code
description
status
created_at
updated_at
```

## positions

```txt
id
name
code
description
base_salary
salary_step_amount
status
created_at
updated_at
```

## employees

```txt
id
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
created_at
updated_at
```

## attendance_records

```txt
id
employee_id
date
status
note
created_by_id
updated_by_id
created_at
updated_at
```

Status:

```txt
present
leave_paid
leave_unpaid
```

## attendance_locks

```txt
id
month
locked_by_id
locked_at
is_locked
note
```

## allowance_types

```txt
id
name
code
calculation_type
amount
unit
is_taxable
is_insurance_based
apply_scope
status
created_at
updated_at
```

Calculation types:

```txt
fixed_monthly
per_working_day
attendance_rate
manual_bonus
project_bonus
deduction
```

Apply scopes:

```txt
company
department
position
employee
```

## allowance_rules

```txt
id
allowance_type_id
min_attendance_percent nullable
amount
apply_scope
department_id nullable
position_id nullable
employee_id nullable
effective_from
effective_to nullable
status
created_at
updated_at
```

## employee_monthly_allowances

```txt
id
employee_id
allowance_type_id
month
amount
note
created_by_id
created_at
updated_at
```

## salary_advances

```txt
id
employee_id
month
amount
advance_date
note
created_by_id
created_at
updated_at
```

## tax_settings

```txt
id
personal_deduction
dependent_deduction
social_insurance_rate
health_insurance_rate
unemployment_insurance_rate
effective_from
status
created_at
updated_at
```

## tax_brackets

```txt
id
tax_setting_id
level
income_from
income_to nullable
tax_rate
created_at
updated_at
```

## payrolls

```txt
id
employee_id
month
position_salary
total_allowances
total_bonuses
total_deductions
insurance_base
social_insurance
health_insurance
unemployment_insurance
taxable_income
personal_deduction
dependent_deduction
taxable_income_after_deduction
personal_income_tax
salary_advance
net_salary
status
calculated_by_id
finalized_by_id nullable
finalized_at nullable
created_at
updated_at
```

Status:

```txt
draft
finalized
published
locked
```

## payroll_items

```txt
id
payroll_id
name
code
type
amount
is_taxable
is_insurance_based
note
created_at
```

## payroll_locks

```txt
id
month
locked_by_id
locked_at
is_locked
note
```

## smtp_settings

```txt
id
host
port
username
password_encrypted
from_email
from_name
encryption
is_active
created_at
updated_at
```

## email_templates

```txt
id
code
name
subject
body
is_active
created_at
updated_at
```

## email_logs

```txt
id
to_email
subject
template_code
status
error_message
sent_at
created_at
```

## projects

```txt
id
project_code
name
customer_name
customer_contact_name
customer_phone
customer_email
customer_address
customer_tax_code
description
manager_id
start_date
end_date
actual_completed_date
location
status
progress_percent
budget_estimated
budget_actual
note
created_at
updated_at
```

## project_contracts

```txt
id
project_id
contract_number
signed_date
contract_value
effective_date
expiration_date
file_url
status
note
created_at
updated_at
```

## project_plans

```txt
id
project_id
name
description
start_date
end_date
owner_id
progress_percent
status
sort_order
created_at
updated_at
```

## project_tasks

```txt
id
project_id
plan_id nullable
title
description
assignee_id
assigned_by_id
priority
status
progress_percent
start_date
deadline
confirmed_at nullable
submitted_at nullable
completed_at nullable
created_at
updated_at
```

## project_task_comments

```txt
id
task_id
user_id
comment
created_at
updated_at
```

## project_issues

```txt
id
project_id
task_id nullable
title
description
severity
reported_by_id
assigned_to_id
status
root_cause
solution
deadline
closed_at nullable
created_at
updated_at
```

## project_materials

```txt
id
project_id
material_code
material_name
unit
planned_quantity
used_quantity
remaining_quantity
estimated_unit_price
actual_unit_price
supplier_name
needed_date
status
note
created_at
updated_at
```

## purchase_requests

```txt
id
project_id
material_id nullable
requested_by_id
approved_by_id nullable
quantity
reason
needed_date
status
quotation_file_url
note
created_at
updated_at
```

## project_costs

```txt
id
project_id
cost_type
name
amount
cost_date
created_by_id
note
created_at
updated_at
```

## project_members

```txt
id
project_id
employee_id
project_role
joined_date
left_date nullable
status
created_at
updated_at
```

## document_types

```txt
id
code
name
description
status
created_at
updated_at
```

## project_documents

```txt
id
project_id
document_type_id
title
file_name
file_url
file_size
mime_type
version
security_level
status
uploaded_by_id
approved_by_id nullable
approved_at nullable
note
created_at
updated_at
```

## document_permissions

```txt
id
document_type_id
role_id
security_level nullable
can_view
can_upload
can_edit
can_delete
can_download
can_approve
created_at
updated_at
```

## document_access_logs

```txt
id
document_id
user_id
action
ip_address
user_agent
created_at
```

## project_activity_logs

```txt
id
project_id
actor_id
action
target_type
target_id
old_value
new_value
created_at
```

## project_import_logs

```txt
id
import_type
file_name
status
total_rows
success_rows
failed_rows
error_file_url
imported_by_id
created_at
```

## project_export_logs

```txt
id
export_type
file_name
format
filters_json
exported_by_id
created_at
```

## inventory_categories

```txt
id
code
name
description
status
created_at
updated_at
deleted_at
```

## inventory_suppliers

```txt
id
code
name
contact_name
phone
email
address
tax_code
description
status
created_at
updated_at
deleted_at
```

## inventory_items

```txt
id
material_code
material_name
category_id
supplier_id
purchase_price
selling_price
markup_percentage
stock_quantity
minimum_stock_quantity
unit
status
description
metadata
created_by_id
updated_by_id
created_at
updated_at
deleted_at
```

## inventory_stock_movements

```txt
id
item_id
movement_type
quantity
unit_cost
previous_stock
resulting_stock
reference_type
reference_id
project_id
note
metadata
created_by_id
created_at
```

## project_statistics_snapshots

```txt
id
project_id
month
progress_percent
total_tasks
completed_tasks
overdue_tasks
total_issues
open_issues
estimated_budget
actual_cost
created_at
```

## audit_logs

```txt
id
actor_id
action
module
target_type
target_id
old_value
new_value
ip_address
user_agent
created_at
```
