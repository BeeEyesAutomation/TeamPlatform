-- CreateEnum
CREATE TYPE "InventoryItemStatus" AS ENUM ('active', 'inactive', 'discontinued');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('receipt', 'issue', 'adjustment', 'return', 'reservation', 'release');

-- CreateTable
CREATE TABLE "inventory_categories" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_suppliers" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "contact_name" VARCHAR(255),
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "address" TEXT,
    "tax_code" VARCHAR(100),
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "material_code" VARCHAR(100) NOT NULL,
    "material_name" VARCHAR(255) NOT NULL,
    "category_id" TEXT,
    "supplier_id" TEXT,
    "purchase_price" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "selling_price" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "markup_percentage" DECIMAL(9,3) NOT NULL DEFAULT 0,
    "stock_quantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "minimum_stock_quantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "unit" VARCHAR(50) NOT NULL,
    "status" "InventoryItemStatus" NOT NULL DEFAULT 'active',
    "description" TEXT,
    "metadata" JSONB,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_stock_movements" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "movement_type" "InventoryMovementType" NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "unit_cost" DECIMAL(18,2),
    "previous_stock" DECIMAL(18,3) NOT NULL,
    "resulting_stock" DECIMAL(18,3) NOT NULL,
    "reference_type" VARCHAR(100),
    "reference_id" VARCHAR(100),
    "project_id" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_categories_code_key" ON "inventory_categories"("code");
CREATE INDEX "inventory_categories_code_idx" ON "inventory_categories"("code");
CREATE INDEX "inventory_categories_status_idx" ON "inventory_categories"("status");
CREATE INDEX "inventory_categories_created_at_idx" ON "inventory_categories"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_suppliers_code_key" ON "inventory_suppliers"("code");
CREATE INDEX "inventory_suppliers_code_idx" ON "inventory_suppliers"("code");
CREATE INDEX "inventory_suppliers_status_idx" ON "inventory_suppliers"("status");
CREATE INDEX "inventory_suppliers_created_at_idx" ON "inventory_suppliers"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_material_code_key" ON "inventory_items"("material_code");
CREATE INDEX "inventory_items_material_code_idx" ON "inventory_items"("material_code");
CREATE INDEX "inventory_items_material_name_idx" ON "inventory_items"("material_name");
CREATE INDEX "inventory_items_category_id_idx" ON "inventory_items"("category_id");
CREATE INDEX "inventory_items_supplier_id_idx" ON "inventory_items"("supplier_id");
CREATE INDEX "inventory_items_status_idx" ON "inventory_items"("status");
CREATE INDEX "inventory_items_created_at_idx" ON "inventory_items"("created_at");

-- CreateIndex
CREATE INDEX "inventory_stock_movements_item_id_idx" ON "inventory_stock_movements"("item_id");
CREATE INDEX "inventory_stock_movements_movement_type_idx" ON "inventory_stock_movements"("movement_type");
CREATE INDEX "inventory_stock_movements_reference_type_reference_id_idx" ON "inventory_stock_movements"("reference_type", "reference_id");
CREATE INDEX "inventory_stock_movements_project_id_idx" ON "inventory_stock_movements"("project_id");
CREATE INDEX "inventory_stock_movements_created_at_idx" ON "inventory_stock_movements"("created_at");

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "inventory_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "inventory_suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_stock_movements" ADD CONSTRAINT "inventory_stock_movements_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
