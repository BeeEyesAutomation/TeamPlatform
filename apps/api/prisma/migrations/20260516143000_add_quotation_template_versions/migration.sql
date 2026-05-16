ALTER TABLE "quotation_templates" ADD COLUMN IF NOT EXISTS "default_version_id" TEXT;
CREATE INDEX IF NOT EXISTS "quotation_templates_default_version_id_idx" ON "quotation_templates"("default_version_id");

CREATE TABLE IF NOT EXISTS "quotation_template_versions" (
  "id" TEXT NOT NULL,
  "template_id" TEXT NOT NULL,
  "version_number" INTEGER NOT NULL,
  "original_file_url" TEXT,
  "sheet_name" VARCHAR(255),
  "layout_config" JSONB,
  "placeholder_config" JSONB,
  "table_config" JSONB,
  "canvas_config" JSONB,
  "status" "RecordStatus" NOT NULL DEFAULT 'active',
  "created_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "quotation_template_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "quotation_template_versions_template_id_version_number_key" ON "quotation_template_versions"("template_id", "version_number");
CREATE INDEX IF NOT EXISTS "quotation_template_versions_template_id_idx" ON "quotation_template_versions"("template_id");
CREATE INDEX IF NOT EXISTS "quotation_template_versions_version_number_idx" ON "quotation_template_versions"("version_number");
CREATE INDEX IF NOT EXISTS "quotation_template_versions_status_idx" ON "quotation_template_versions"("status");
CREATE INDEX IF NOT EXISTS "quotation_template_versions_created_at_idx" ON "quotation_template_versions"("created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quotation_template_versions_template_id_fkey'
  ) THEN
    ALTER TABLE "quotation_template_versions"
      ADD CONSTRAINT "quotation_template_versions_template_id_fkey"
      FOREIGN KEY ("template_id") REFERENCES "quotation_templates"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
