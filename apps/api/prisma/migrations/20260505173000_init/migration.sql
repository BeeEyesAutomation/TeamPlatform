-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('active', 'inactive');
CREATE TYPE "EmployeeStatus" AS ENUM ('probation', 'active', 'temporarily_inactive', 'resigned');
CREATE TYPE "EmploymentType" AS ENUM ('official', 'probation', 'seasonal', 'part_time');
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'leave_paid', 'leave_unpaid');
CREATE TYPE "AllowanceCalculationType" AS ENUM ('fixed_monthly', 'per_working_day', 'attendance_rate', 'manual_bonus', 'project_bonus', 'deduction');
CREATE TYPE "ApplyScope" AS ENUM ('company', 'department', 'position', 'employee');
CREATE TYPE "PayrollStatus" AS ENUM ('draft', 'finalized', 'published', 'locked');
CREATE TYPE "ProjectStatus" AS ENUM ('planning', 'in_progress', 'paused', 'completed', 'cancelled');
CREATE TYPE "ProjectPlanStatus" AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE "ProjectTaskStatus" AS ENUM ('todo', 'confirmed', 'in_progress', 'pending_review', 'completed', 'cancelled');
CREATE TYPE "ProjectIssueStatus" AS ENUM ('new', 'in_progress', 'waiting_confirmation', 'resolved', 'closed');
CREATE TYPE "MaterialStatus" AS ENUM ('not_ordered', 'purchase_requested', 'purchasing', 'received', 'issued', 'shortage', 'cancelled');
CREATE TYPE "PurchaseRequestStatus" AS ENUM ('pending', 'approved', 'rejected', 'received', 'cancelled');
CREATE TYPE "SecurityLevel" AS ENUM ('project_public', 'internal_company', 'pm_admin_only', 'accounting', 'confidential', 'client_shared');
CREATE TYPE "DocumentStatus" AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'archived');
CREATE TYPE "DocumentAction" AS ENUM ('view', 'upload', 'edit', 'delete', 'download', 'approve', 'reject');
CREATE TYPE "EmailEncryption" AS ENUM ('none', 'ssl', 'starttls');
CREATE TYPE "EmailLogStatus" AS ENUM ('pending', 'sent', 'failed', 'retrying');
CREATE TYPE "ImportExportStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE "ExportFormat" AS ENUM ('excel', 'csv', 'pdf');

-- CreateTable
CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "full_name" VARCHAR(255) NOT NULL,
  "employee_id" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "last_login_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "roles" (
  "id" TEXT NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "status" "RecordStatus" NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "permissions" (
  "id" TEXT NOT NULL,
  "code" VARCHAR(150) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_roles" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "role_id" TEXT NOT NULL,
  CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "role_permissions" (
  "id" TEXT NOT NULL,
  "role_id" TEXT NOT NULL,
  "permission_id" TEXT NOT NULL,
  CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "actor_id" TEXT,
  "action" VARCHAR(100) NOT NULL,
  "module" VARCHAR(100) NOT NULL,
  "target_type" VARCHAR(100),
  "target_id" VARCHAR(100),
  "old_value" JSONB,
  "new_value" JSONB,
  "metadata" JSONB,
  "ip_address" VARCHAR(100),
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "departments" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "status" "RecordStatus" NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "positions" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "base_salary" DECIMAL(18,2) NOT NULL,
  "salary_step_amount" DECIMAL(18,2) NOT NULL,
  "status" "RecordStatus" NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "employees" (
  "id" TEXT NOT NULL,
  "employee_code" VARCHAR(100) NOT NULL,
  "full_name" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(50),
  "email" VARCHAR(255),
  "date_of_birth" TIMESTAMP(3),
  "gender" VARCHAR(50),
  "address" TEXT,
  "avatar_url" TEXT,
  "citizen_id_number" VARCHAR(100),
  "citizen_id_issue_date" TIMESTAMP(3),
  "citizen_id_issue_place" VARCHAR(255),
  "citizen_id_front_image_url" TEXT,
  "citizen_id_back_image_url" TEXT,
  "bank_name" VARCHAR(255),
  "bank_account_number" VARCHAR(100),
  "bank_account_holder" VARCHAR(255),
  "bank_branch" VARCHAR(255),
  "department_id" TEXT,
  "position_id" TEXT,
  "salary_level" INTEGER NOT NULL DEFAULT 0,
  "start_date" TIMESTAMP(3),
  "employment_type" "EmploymentType" NOT NULL DEFAULT 'official',
  "status" "EmployeeStatus" NOT NULL DEFAULT 'active',
  "emergency_contact_name" VARCHAR(255),
  "emergency_contact_phone" VARCHAR(50),
  "emergency_contact_relation" VARCHAR(100),
  "dependent_count" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attendance_records" (
  "id" TEXT NOT NULL,
  "employee_id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "status" "AttendanceStatus" NOT NULL DEFAULT 'present',
  "note" TEXT,
  "created_by_id" TEXT,
  "updated_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tax_settings" (
  "id" TEXT NOT NULL,
  "personal_deduction" DECIMAL(18,2) NOT NULL,
  "dependent_deduction" DECIMAL(18,2) NOT NULL,
  "social_insurance_rate" DECIMAL(5,2) NOT NULL,
  "health_insurance_rate" DECIMAL(5,2) NOT NULL,
  "unemployment_insurance_rate" DECIMAL(5,2) NOT NULL,
  "effective_from" TIMESTAMP(3) NOT NULL,
  "status" "RecordStatus" NOT NULL DEFAULT 'active',
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tax_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tax_brackets" (
  "id" TEXT NOT NULL,
  "tax_setting_id" TEXT NOT NULL,
  "level" INTEGER NOT NULL,
  "income_from" DECIMAL(18,2) NOT NULL,
  "income_to" DECIMAL(18,2),
  "tax_rate" DECIMAL(5,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tax_brackets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "allowance_types" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "calculation_type" "AllowanceCalculationType" NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "unit" VARCHAR(50),
  "is_taxable" BOOLEAN NOT NULL DEFAULT false,
  "is_insurance_based" BOOLEAN NOT NULL DEFAULT false,
  "apply_scope" "ApplyScope" NOT NULL DEFAULT 'company',
  "status" "RecordStatus" NOT NULL DEFAULT 'active',
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "allowance_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payrolls" (
  "id" TEXT NOT NULL,
  "employee_id" TEXT NOT NULL,
  "month" VARCHAR(7) NOT NULL,
  "position_salary" DECIMAL(18,2) NOT NULL,
  "total_allowances" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "total_bonuses" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "total_deductions" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "insurance_base" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "social_insurance" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "health_insurance" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "unemployment_insurance" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "taxable_income" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "personal_deduction" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "dependent_deduction" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "taxable_income_after_deduction" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "personal_income_tax" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "salary_advance" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "net_salary" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "status" "PayrollStatus" NOT NULL DEFAULT 'draft',
  "calculated_by_id" TEXT,
  "finalized_by_id" TEXT,
  "finalized_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payroll_items" (
  "id" TEXT NOT NULL,
  "payroll_id" TEXT NOT NULL,
  "allowance_type_id" TEXT,
  "name" VARCHAR(255) NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "type" VARCHAR(100) NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "is_taxable" BOOLEAN NOT NULL DEFAULT false,
  "is_insurance_based" BOOLEAN NOT NULL DEFAULT false,
  "note" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payroll_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "projects" (
  "id" TEXT NOT NULL,
  "project_code" VARCHAR(100) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "customer_name" VARCHAR(255),
  "customer_contact_name" VARCHAR(255),
  "customer_phone" VARCHAR(50),
  "customer_email" VARCHAR(255),
  "customer_address" TEXT,
  "customer_tax_code" VARCHAR(100),
  "description" TEXT,
  "manager_id" TEXT,
  "start_date" TIMESTAMP(3),
  "end_date" TIMESTAMP(3),
  "actual_completed_date" TIMESTAMP(3),
  "location" VARCHAR(255),
  "status" "ProjectStatus" NOT NULL DEFAULT 'planning',
  "progress_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "budget_estimated" DECIMAL(18,2),
  "budget_actual" DECIMAL(18,2),
  "note" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_members" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "employee_id" TEXT NOT NULL,
  "project_role" VARCHAR(100) NOT NULL,
  "joined_date" TIMESTAMP(3) NOT NULL,
  "left_date" TIMESTAMP(3),
  "status" "RecordStatus" NOT NULL DEFAULT 'active',
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_plans" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "start_date" TIMESTAMP(3),
  "end_date" TIMESTAMP(3),
  "owner_id" TEXT,
  "progress_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "status" "ProjectPlanStatus" NOT NULL DEFAULT 'planned',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "project_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_tasks" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "plan_id" TEXT,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "assignee_id" TEXT,
  "assigned_by_id" TEXT,
  "priority" VARCHAR(50),
  "status" "ProjectTaskStatus" NOT NULL DEFAULT 'todo',
  "progress_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "start_date" TIMESTAMP(3),
  "deadline" TIMESTAMP(3),
  "confirmed_at" TIMESTAMP(3),
  "submitted_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "project_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_issues" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "task_id" TEXT,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "severity" VARCHAR(50),
  "reported_by_id" TEXT,
  "assigned_to_id" TEXT,
  "status" "ProjectIssueStatus" NOT NULL DEFAULT 'new',
  "root_cause" TEXT,
  "solution" TEXT,
  "deadline" TIMESTAMP(3),
  "closed_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "project_issues_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_materials" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "material_code" VARCHAR(100) NOT NULL,
  "material_name" VARCHAR(255) NOT NULL,
  "unit" VARCHAR(50) NOT NULL,
  "planned_quantity" DECIMAL(18,3) NOT NULL,
  "used_quantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
  "remaining_quantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
  "estimated_unit_price" DECIMAL(18,2),
  "actual_unit_price" DECIMAL(18,2),
  "supplier_name" VARCHAR(255),
  "needed_date" TIMESTAMP(3),
  "status" "MaterialStatus" NOT NULL DEFAULT 'not_ordered',
  "note" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "project_materials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_costs" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "cost_type" VARCHAR(100) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "cost_date" TIMESTAMP(3) NOT NULL,
  "created_by_id" TEXT,
  "note" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "project_costs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "purchase_requests" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "material_id" TEXT,
  "requested_by_id" TEXT,
  "approved_by_id" TEXT,
  "quantity" DECIMAL(18,3) NOT NULL,
  "reason" TEXT,
  "needed_date" TIMESTAMP(3),
  "status" "PurchaseRequestStatus" NOT NULL DEFAULT 'pending',
  "quotation_file_url" TEXT,
  "note" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_types" (
  "id" TEXT NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "status" "RecordStatus" NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_documents" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "document_type_id" TEXT NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "file_name" VARCHAR(255) NOT NULL,
  "file_url" TEXT NOT NULL,
  "file_size" INTEGER,
  "mime_type" VARCHAR(100),
  "version" VARCHAR(50) NOT NULL DEFAULT '1',
  "security_level" "SecurityLevel" NOT NULL,
  "status" "DocumentStatus" NOT NULL DEFAULT 'draft',
  "uploaded_by_id" TEXT,
  "approved_by_id" TEXT,
  "approved_at" TIMESTAMP(3),
  "note" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "project_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_permissions" (
  "id" TEXT NOT NULL,
  "document_type_id" TEXT NOT NULL,
  "role_id" TEXT NOT NULL,
  "security_level" "SecurityLevel",
  "can_view" BOOLEAN NOT NULL DEFAULT false,
  "can_upload" BOOLEAN NOT NULL DEFAULT false,
  "can_edit" BOOLEAN NOT NULL DEFAULT false,
  "can_delete" BOOLEAN NOT NULL DEFAULT false,
  "can_download" BOOLEAN NOT NULL DEFAULT false,
  "can_approve" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "document_permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_access_logs" (
  "id" TEXT NOT NULL,
  "document_id" TEXT NOT NULL,
  "user_id" TEXT,
  "action" "DocumentAction" NOT NULL,
  "ip_address" VARCHAR(100),
  "user_agent" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_access_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_settings" (
  "id" TEXT NOT NULL,
  "host" VARCHAR(255) NOT NULL,
  "port" INTEGER NOT NULL,
  "username" VARCHAR(255) NOT NULL,
  "password_encrypted" TEXT NOT NULL,
  "from_email" VARCHAR(255) NOT NULL,
  "from_name" VARCHAR(255) NOT NULL,
  "encryption" "EmailEncryption" NOT NULL DEFAULT 'starttls',
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "email_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_templates" (
  "id" TEXT NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "subject" VARCHAR(255) NOT NULL,
  "body" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_logs" (
  "id" TEXT NOT NULL,
  "to_email" VARCHAR(255) NOT NULL,
  "subject" VARCHAR(255) NOT NULL,
  "template_code" VARCHAR(100),
  "status" "EmailLogStatus" NOT NULL DEFAULT 'pending',
  "error_message" TEXT,
  "sent_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "import_logs" (
  "id" TEXT NOT NULL,
  "import_type" VARCHAR(100) NOT NULL,
  "file_name" VARCHAR(255) NOT NULL,
  "status" "ImportExportStatus" NOT NULL DEFAULT 'pending',
  "total_rows" INTEGER NOT NULL DEFAULT 0,
  "success_rows" INTEGER NOT NULL DEFAULT 0,
  "failed_rows" INTEGER NOT NULL DEFAULT 0,
  "error_file_url" TEXT,
  "imported_by_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "import_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "export_logs" (
  "id" TEXT NOT NULL,
  "export_type" VARCHAR(100) NOT NULL,
  "file_name" VARCHAR(255) NOT NULL,
  "format" "ExportFormat" NOT NULL,
  "filters_json" JSONB,
  "exported_by_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "export_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_employee_id_key" ON "users"("employee_id");
CREATE INDEX "users_is_active_idx" ON "users"("is_active");
CREATE INDEX "users_created_at_idx" ON "users"("created_at");
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");
CREATE INDEX "roles_status_idx" ON "roles"("status");
CREATE INDEX "roles_created_at_idx" ON "roles"("created_at");
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions"("role_id");
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");
CREATE INDEX "audit_logs_module_idx" ON "audit_logs"("module");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");
CREATE INDEX "departments_status_idx" ON "departments"("status");
CREATE INDEX "departments_created_at_idx" ON "departments"("created_at");
CREATE UNIQUE INDEX "positions_code_key" ON "positions"("code");
CREATE INDEX "positions_status_idx" ON "positions"("status");
CREATE INDEX "positions_created_at_idx" ON "positions"("created_at");
CREATE UNIQUE INDEX "employees_employee_code_key" ON "employees"("employee_code");
CREATE INDEX "employees_employee_code_idx" ON "employees"("employee_code");
CREATE INDEX "employees_department_id_idx" ON "employees"("department_id");
CREATE INDEX "employees_position_id_idx" ON "employees"("position_id");
CREATE INDEX "employees_status_idx" ON "employees"("status");
CREATE INDEX "employees_created_at_idx" ON "employees"("created_at");
CREATE UNIQUE INDEX "attendance_records_employee_id_date_key" ON "attendance_records"("employee_id", "date");
CREATE INDEX "attendance_records_date_idx" ON "attendance_records"("date");
CREATE INDEX "attendance_records_status_idx" ON "attendance_records"("status");
CREATE INDEX "attendance_records_created_at_idx" ON "attendance_records"("created_at");
CREATE INDEX "tax_settings_effective_from_idx" ON "tax_settings"("effective_from");
CREATE INDEX "tax_settings_status_idx" ON "tax_settings"("status");
CREATE INDEX "tax_settings_created_at_idx" ON "tax_settings"("created_at");
CREATE UNIQUE INDEX "tax_brackets_tax_setting_id_level_key" ON "tax_brackets"("tax_setting_id", "level");
CREATE INDEX "tax_brackets_tax_setting_id_idx" ON "tax_brackets"("tax_setting_id");
CREATE INDEX "tax_brackets_created_at_idx" ON "tax_brackets"("created_at");
CREATE UNIQUE INDEX "allowance_types_code_key" ON "allowance_types"("code");
CREATE INDEX "allowance_types_code_idx" ON "allowance_types"("code");
CREATE INDEX "allowance_types_calculation_type_idx" ON "allowance_types"("calculation_type");
CREATE INDEX "allowance_types_status_idx" ON "allowance_types"("status");
CREATE INDEX "allowance_types_created_at_idx" ON "allowance_types"("created_at");
CREATE UNIQUE INDEX "payrolls_employee_id_month_key" ON "payrolls"("employee_id", "month");
CREATE INDEX "payrolls_employee_id_idx" ON "payrolls"("employee_id");
CREATE INDEX "payrolls_month_idx" ON "payrolls"("month");
CREATE INDEX "payrolls_status_idx" ON "payrolls"("status");
CREATE INDEX "payrolls_created_at_idx" ON "payrolls"("created_at");
CREATE INDEX "payroll_items_payroll_id_idx" ON "payroll_items"("payroll_id");
CREATE INDEX "payroll_items_code_idx" ON "payroll_items"("code");
CREATE INDEX "payroll_items_type_idx" ON "payroll_items"("type");
CREATE INDEX "payroll_items_created_at_idx" ON "payroll_items"("created_at");
CREATE UNIQUE INDEX "projects_project_code_key" ON "projects"("project_code");
CREATE INDEX "projects_project_code_idx" ON "projects"("project_code");
CREATE INDEX "projects_manager_id_idx" ON "projects"("manager_id");
CREATE INDEX "projects_status_idx" ON "projects"("status");
CREATE INDEX "projects_created_at_idx" ON "projects"("created_at");
CREATE UNIQUE INDEX "project_members_project_id_employee_id_key" ON "project_members"("project_id", "employee_id");
CREATE INDEX "project_members_project_id_idx" ON "project_members"("project_id");
CREATE INDEX "project_members_employee_id_idx" ON "project_members"("employee_id");
CREATE INDEX "project_members_status_idx" ON "project_members"("status");
CREATE INDEX "project_members_created_at_idx" ON "project_members"("created_at");
CREATE INDEX "project_plans_project_id_idx" ON "project_plans"("project_id");
CREATE INDEX "project_plans_status_idx" ON "project_plans"("status");
CREATE INDEX "project_plans_created_at_idx" ON "project_plans"("created_at");
CREATE INDEX "project_tasks_project_id_idx" ON "project_tasks"("project_id");
CREATE INDEX "project_tasks_plan_id_idx" ON "project_tasks"("plan_id");
CREATE INDEX "project_tasks_assignee_id_idx" ON "project_tasks"("assignee_id");
CREATE INDEX "project_tasks_deadline_idx" ON "project_tasks"("deadline");
CREATE INDEX "project_tasks_status_idx" ON "project_tasks"("status");
CREATE INDEX "project_tasks_created_at_idx" ON "project_tasks"("created_at");
CREATE INDEX "project_issues_project_id_idx" ON "project_issues"("project_id");
CREATE INDEX "project_issues_task_id_idx" ON "project_issues"("task_id");
CREATE INDEX "project_issues_assigned_to_id_idx" ON "project_issues"("assigned_to_id");
CREATE INDEX "project_issues_deadline_idx" ON "project_issues"("deadline");
CREATE INDEX "project_issues_status_idx" ON "project_issues"("status");
CREATE INDEX "project_issues_created_at_idx" ON "project_issues"("created_at");
CREATE UNIQUE INDEX "project_materials_project_id_material_code_key" ON "project_materials"("project_id", "material_code");
CREATE INDEX "project_materials_project_id_idx" ON "project_materials"("project_id");
CREATE INDEX "project_materials_material_code_idx" ON "project_materials"("material_code");
CREATE INDEX "project_materials_status_idx" ON "project_materials"("status");
CREATE INDEX "project_materials_created_at_idx" ON "project_materials"("created_at");
CREATE INDEX "project_costs_project_id_idx" ON "project_costs"("project_id");
CREATE INDEX "project_costs_cost_type_idx" ON "project_costs"("cost_type");
CREATE INDEX "project_costs_cost_date_idx" ON "project_costs"("cost_date");
CREATE INDEX "project_costs_created_at_idx" ON "project_costs"("created_at");
CREATE INDEX "purchase_requests_project_id_idx" ON "purchase_requests"("project_id");
CREATE INDEX "purchase_requests_material_id_idx" ON "purchase_requests"("material_id");
CREATE INDEX "purchase_requests_status_idx" ON "purchase_requests"("status");
CREATE INDEX "purchase_requests_created_at_idx" ON "purchase_requests"("created_at");
CREATE UNIQUE INDEX "document_types_code_key" ON "document_types"("code");
CREATE INDEX "document_types_code_idx" ON "document_types"("code");
CREATE INDEX "document_types_status_idx" ON "document_types"("status");
CREATE INDEX "document_types_created_at_idx" ON "document_types"("created_at");
CREATE INDEX "project_documents_project_id_idx" ON "project_documents"("project_id");
CREATE INDEX "project_documents_document_type_id_idx" ON "project_documents"("document_type_id");
CREATE INDEX "project_documents_security_level_idx" ON "project_documents"("security_level");
CREATE INDEX "project_documents_status_idx" ON "project_documents"("status");
CREATE INDEX "project_documents_created_at_idx" ON "project_documents"("created_at");
CREATE UNIQUE INDEX "document_permissions_document_type_id_role_id_security_level_key" ON "document_permissions"("document_type_id", "role_id", "security_level");
CREATE INDEX "document_permissions_role_id_idx" ON "document_permissions"("role_id");
CREATE INDEX "document_permissions_security_level_idx" ON "document_permissions"("security_level");
CREATE INDEX "document_permissions_created_at_idx" ON "document_permissions"("created_at");
CREATE INDEX "document_access_logs_document_id_idx" ON "document_access_logs"("document_id");
CREATE INDEX "document_access_logs_user_id_idx" ON "document_access_logs"("user_id");
CREATE INDEX "document_access_logs_action_idx" ON "document_access_logs"("action");
CREATE INDEX "document_access_logs_created_at_idx" ON "document_access_logs"("created_at");
CREATE INDEX "email_settings_is_active_idx" ON "email_settings"("is_active");
CREATE INDEX "email_settings_created_at_idx" ON "email_settings"("created_at");
CREATE UNIQUE INDEX "email_templates_code_key" ON "email_templates"("code");
CREATE INDEX "email_templates_code_idx" ON "email_templates"("code");
CREATE INDEX "email_templates_is_active_idx" ON "email_templates"("is_active");
CREATE INDEX "email_templates_created_at_idx" ON "email_templates"("created_at");
CREATE INDEX "email_logs_template_code_idx" ON "email_logs"("template_code");
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");
CREATE INDEX "email_logs_created_at_idx" ON "email_logs"("created_at");
CREATE INDEX "import_logs_import_type_idx" ON "import_logs"("import_type");
CREATE INDEX "import_logs_status_idx" ON "import_logs"("status");
CREATE INDEX "import_logs_created_at_idx" ON "import_logs"("created_at");
CREATE INDEX "export_logs_export_type_idx" ON "export_logs"("export_type");
CREATE INDEX "export_logs_format_idx" ON "export_logs"("format");
CREATE INDEX "export_logs_created_at_idx" ON "export_logs"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "employees" ADD CONSTRAINT "employees_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tax_brackets" ADD CONSTRAINT "tax_brackets_tax_setting_id_fkey" FOREIGN KEY ("tax_setting_id") REFERENCES "tax_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "payrolls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_allowance_type_id_fkey" FOREIGN KEY ("allowance_type_id") REFERENCES "allowance_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_plans" ADD CONSTRAINT "project_plans_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "project_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_issues" ADD CONSTRAINT "project_issues_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_issues" ADD CONSTRAINT "project_issues_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "project_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_materials" ADD CONSTRAINT "project_materials_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_costs" ADD CONSTRAINT "project_costs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "project_materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "document_permissions" ADD CONSTRAINT "document_permissions_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_permissions" ADD CONSTRAINT "document_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "project_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
