DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuotationStatus') THEN
    CREATE TYPE "QuotationStatus" AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'cancelled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "quotations" (
  "id" TEXT NOT NULL,
  "quotation_code" VARCHAR(100) NOT NULL,
  "project_id" TEXT,
  "customer_name" VARCHAR(255) NOT NULL,
  "customer_request" TEXT,
  "quotation_date" TIMESTAMP(3) NOT NULL,
  "number_of_sets" DECIMAL(18,3) NOT NULL DEFAULT 1,
  "vat_enabled" BOOLEAN NOT NULL DEFAULT false,
  "vat_rate" DECIMAL(9,3) NOT NULL DEFAULT 10,
  "subtotal_one_set" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "total_before_vat" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "vat_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "grand_total" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "signature_image_url" TEXT,
  "status" "QuotationStatus" NOT NULL DEFAULT 'draft',
  "metadata" JSONB,
  "created_by_id" TEXT,
  "updated_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "quotation_items" (
  "id" TEXT NOT NULL,
  "quotation_id" TEXT NOT NULL,
  "line_index" INTEGER NOT NULL,
  "material_id" TEXT,
  "material_code_snapshot" VARCHAR(100) NOT NULL,
  "material_name_snapshot" VARCHAR(255) NOT NULL,
  "unit_snapshot" VARCHAR(50) NOT NULL,
  "quantity" DECIMAL(18,3) NOT NULL,
  "unit_price" DECIMAL(18,2) NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "quotation_images" (
  "id" TEXT NOT NULL,
  "quotation_id" TEXT NOT NULL,
  "file_name" VARCHAR(255) NOT NULL,
  "file_url" TEXT NOT NULL,
  "file_size" INTEGER,
  "mime_type" VARCHAR(100),
  "uploaded_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "quotation_images_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "quotations_quotation_code_key" ON "quotations"("quotation_code");
CREATE INDEX IF NOT EXISTS "quotations_quotation_code_idx" ON "quotations"("quotation_code");
CREATE INDEX IF NOT EXISTS "quotations_project_id_idx" ON "quotations"("project_id");
CREATE INDEX IF NOT EXISTS "quotations_customer_name_idx" ON "quotations"("customer_name");
CREATE INDEX IF NOT EXISTS "quotations_quotation_date_idx" ON "quotations"("quotation_date");
CREATE INDEX IF NOT EXISTS "quotations_status_idx" ON "quotations"("status");
CREATE INDEX IF NOT EXISTS "quotations_created_at_idx" ON "quotations"("created_at");
CREATE INDEX IF NOT EXISTS "quotation_items_quotation_id_idx" ON "quotation_items"("quotation_id");
CREATE INDEX IF NOT EXISTS "quotation_items_material_id_idx" ON "quotation_items"("material_id");
CREATE INDEX IF NOT EXISTS "quotation_items_line_index_idx" ON "quotation_items"("line_index");
CREATE INDEX IF NOT EXISTS "quotation_images_quotation_id_idx" ON "quotation_images"("quotation_id");
CREATE INDEX IF NOT EXISTS "quotation_images_uploaded_by_id_idx" ON "quotation_images"("uploaded_by_id");
CREATE INDEX IF NOT EXISTS "quotation_images_created_at_idx" ON "quotation_images"("created_at");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotations_project_id_fkey') THEN
    ALTER TABLE "quotations"
      ADD CONSTRAINT "quotations_project_id_fkey"
      FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotation_items_quotation_id_fkey') THEN
    ALTER TABLE "quotation_items"
      ADD CONSTRAINT "quotation_items_quotation_id_fkey"
      FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotation_items_material_id_fkey') THEN
    ALTER TABLE "quotation_items"
      ADD CONSTRAINT "quotation_items_material_id_fkey"
      FOREIGN KEY ("material_id") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotation_images_quotation_id_fkey') THEN
    ALTER TABLE "quotation_images"
      ADD CONSTRAINT "quotation_images_quotation_id_fkey"
      FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
