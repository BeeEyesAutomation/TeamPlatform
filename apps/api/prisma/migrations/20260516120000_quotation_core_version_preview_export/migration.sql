DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuotationType') THEN
    CREATE TYPE "QuotationType" AS ENUM ('commercial', 'project');
  END IF;
END $$;

ALTER TYPE "QuotationStatus" ADD VALUE IF NOT EXISTS 'approved';

ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "quotation_type" "QuotationType" NOT NULL DEFAULT 'commercial';
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "current_version_id" TEXT;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "content" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "quotations_current_version_id_key" ON "quotations"("current_version_id") WHERE "current_version_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "quotations_quotation_type_idx" ON "quotations"("quotation_type");
CREATE INDEX IF NOT EXISTS "quotations_current_version_id_idx" ON "quotations"("current_version_id");

ALTER TABLE "project_materials" ADD COLUMN IF NOT EXISTS "quotation_id" TEXT;
ALTER TABLE "project_materials" ADD COLUMN IF NOT EXISTS "quotation_version_id" TEXT;
CREATE INDEX IF NOT EXISTS "project_materials_quotation_id_idx" ON "project_materials"("quotation_id");
CREATE INDEX IF NOT EXISTS "project_materials_quotation_version_id_idx" ON "project_materials"("quotation_version_id");

CREATE TABLE IF NOT EXISTS "quotation_versions" (
  "id" TEXT NOT NULL,
  "quotation_id" TEXT NOT NULL,
  "version_number" INTEGER NOT NULL,
  "quotation_type" "QuotationType" NOT NULL DEFAULT 'commercial',
  "project_id" TEXT,
  "customer_name" VARCHAR(255) NOT NULL,
  "customer_request" TEXT,
  "content" TEXT,
  "quotation_date" TIMESTAMP(3) NOT NULL,
  "number_of_sets" DECIMAL(18,3) NOT NULL DEFAULT 1,
  "vat_enabled" BOOLEAN NOT NULL DEFAULT false,
  "vat_rate" DECIMAL(9,3) NOT NULL DEFAULT 10,
  "subtotal_one_set" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "total_before_vat" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "vat_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "grand_total" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "status" "QuotationStatus" NOT NULL DEFAULT 'draft',
  "customer_po_file_name" VARCHAR(255),
  "customer_po_file_url" TEXT,
  "approved_at" TIMESTAMP(3),
  "approved_by_id" TEXT,
  "stock_out_created_at" TIMESTAMP(3),
  "stock_out_created_by_id" TEXT,
  "project_synced_at" TIMESTAMP(3),
  "project_synced_by_id" TEXT,
  "metadata" JSONB,
  "created_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "quotation_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "quotation_version_items" (
  "id" TEXT NOT NULL,
  "quotation_version_id" TEXT NOT NULL,
  "line_index" INTEGER NOT NULL,
  "material_id" TEXT,
  "material_code_snapshot" VARCHAR(100) NOT NULL,
  "material_name_snapshot" VARCHAR(255) NOT NULL,
  "model_snapshot" VARCHAR(255),
  "picture_url_snapshot" TEXT,
  "unit_snapshot" VARCHAR(50) NOT NULL,
  "quantity" DECIMAL(18,3) NOT NULL,
  "unit_price" DECIMAL(18,2) NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "quotation_version_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "quotation_templates" (
  "id" TEXT NOT NULL,
  "quotation_id" TEXT,
  "name" VARCHAR(255) NOT NULL,
  "file_name" VARCHAR(255) NOT NULL,
  "file_url" TEXT NOT NULL,
  "file_size" INTEGER,
  "mime_type" VARCHAR(100),
  "placeholder_config" JSONB,
  "detected_placeholders" JSONB,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "status" "RecordStatus" NOT NULL DEFAULT 'active',
  "uploaded_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "quotation_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "quotation_company_settings" (
  "id" TEXT NOT NULL,
  "company_name" VARCHAR(255),
  "tax_code" VARCHAR(100),
  "address" TEXT,
  "phone" VARCHAR(50),
  "email" VARCHAR(255),
  "bank_account_number" VARCHAR(100),
  "bank_name" VARCHAR(255),
  "bank_branch" VARCHAR(255),
  "metadata" JSONB,
  "updated_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "quotation_company_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "quotation_versions_quotation_id_version_number_key" ON "quotation_versions"("quotation_id", "version_number");
CREATE INDEX IF NOT EXISTS "quotation_versions_quotation_id_idx" ON "quotation_versions"("quotation_id");
CREATE INDEX IF NOT EXISTS "quotation_versions_version_number_idx" ON "quotation_versions"("version_number");
CREATE INDEX IF NOT EXISTS "quotation_versions_status_idx" ON "quotation_versions"("status");
CREATE INDEX IF NOT EXISTS "quotation_versions_project_id_idx" ON "quotation_versions"("project_id");
CREATE INDEX IF NOT EXISTS "quotation_versions_created_at_idx" ON "quotation_versions"("created_at");
CREATE INDEX IF NOT EXISTS "quotation_version_items_quotation_version_id_idx" ON "quotation_version_items"("quotation_version_id");
CREATE INDEX IF NOT EXISTS "quotation_version_items_material_id_idx" ON "quotation_version_items"("material_id");
CREATE INDEX IF NOT EXISTS "quotation_version_items_line_index_idx" ON "quotation_version_items"("line_index");
CREATE INDEX IF NOT EXISTS "quotation_templates_quotation_id_idx" ON "quotation_templates"("quotation_id");
CREATE INDEX IF NOT EXISTS "quotation_templates_is_default_idx" ON "quotation_templates"("is_default");
CREATE INDEX IF NOT EXISTS "quotation_templates_status_idx" ON "quotation_templates"("status");
CREATE INDEX IF NOT EXISTS "quotation_templates_created_at_idx" ON "quotation_templates"("created_at");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotation_versions_quotation_id_fkey') THEN
    ALTER TABLE "quotation_versions" ADD CONSTRAINT "quotation_versions_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotation_version_items_quotation_version_id_fkey') THEN
    ALTER TABLE "quotation_version_items" ADD CONSTRAINT "quotation_version_items_quotation_version_id_fkey" FOREIGN KEY ("quotation_version_id") REFERENCES "quotation_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotation_version_items_material_id_fkey') THEN
    ALTER TABLE "quotation_version_items" ADD CONSTRAINT "quotation_version_items_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotation_templates_quotation_id_fkey') THEN
    ALTER TABLE "quotation_templates" ADD CONSTRAINT "quotation_templates_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotations_current_version_id_fkey') THEN
    ALTER TABLE "quotations" ADD CONSTRAINT "quotations_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "quotation_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
