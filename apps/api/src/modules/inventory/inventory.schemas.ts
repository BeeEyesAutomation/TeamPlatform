import { z } from "zod";
import { paginationQuerySchema } from "../hr/hr.schemas";

const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

const optionalUuidSchema = z.preprocess(emptyToUndefined, z.string().uuid().optional());
const optionalTextSchema = z.preprocess(emptyToUndefined, z.string().trim().max(5000).optional());
const optionalShortTextSchema = z.preprocess(emptyToUndefined, z.string().trim().max(255).optional());
const nonNegativeDecimalSchema = z.coerce.number().min(0);
const optionalNonNegativeDecimalSchema = z.preprocess(emptyToUndefined, nonNegativeDecimalSchema.optional());
const positiveDecimalSchema = z.coerce.number().positive();

export const idParamSchema = z.object({
  id: z.string().uuid()
});

export const inventoryStatusSchema = z.enum(["active", "inactive", "discontinued"]);
export const recordStatusSchema = z.enum(["active", "inactive"]);
export const movementTypeSchema = z.enum(["receipt", "issue", "adjustment", "return", "reservation", "release"]);

export const inventoryItemQuerySchema = paginationQuerySchema.extend({
  categoryId: optionalUuidSchema,
  supplierId: optionalUuidSchema,
  status: z.preprocess(emptyToUndefined, inventoryStatusSchema.optional()),
  lowStock: z.coerce.boolean().optional(),
  stockStatus: z.preprocess(emptyToUndefined, z.enum(["low", "ok"]).optional())
});

export const inventoryItemCreateSchema = z.object({
  materialCode: z.string().trim().min(1).max(100),
  materialName: z.string().trim().min(1).max(255),
  categoryId: z.string().uuid(),
  supplierId: z.string().uuid(),
  purchasePrice: optionalNonNegativeDecimalSchema,
  sellingPrice: optionalNonNegativeDecimalSchema,
  markupPercentage: optionalNonNegativeDecimalSchema,
  stockQuantity: optionalNonNegativeDecimalSchema,
  minimumStockQuantity: optionalNonNegativeDecimalSchema,
  unit: z.string().trim().min(1).max(50),
  status: inventoryStatusSchema.default("active"),
  imageUrl: z.preprocess(emptyToUndefined, z.string().trim().max(1000).optional()),
  description: optionalTextSchema
});

export const inventoryItemUpdateSchema = inventoryItemCreateSchema.partial();

export const inventoryCategoryQuerySchema = paginationQuerySchema.extend({
  status: z.preprocess(emptyToUndefined, recordStatusSchema.optional())
});

export const inventoryCategoryCreateSchema = z.object({
  code: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(255),
  department: optionalShortTextSchema,
  description: optionalTextSchema,
  status: recordStatusSchema.default("active")
});

export const inventoryCategoryUpdateSchema = inventoryCategoryCreateSchema.partial();

export const inventorySupplierQuerySchema = paginationQuerySchema.extend({
  status: z.preprocess(emptyToUndefined, recordStatusSchema.optional())
});

export const inventorySupplierCreateSchema = z.object({
  code: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(255),
  contactName: optionalShortTextSchema,
  phone: z.preprocess(emptyToUndefined, z.string().trim().regex(/^[0-9+\-\s().]{7,20}$/, "Invalid phone number").optional()),
  email: z.preprocess(emptyToUndefined, z.string().trim().email().max(255).optional()),
  address: optionalTextSchema,
  taxCode: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  description: optionalTextSchema,
  status: recordStatusSchema.default("active")
});

export const inventorySupplierUpdateSchema = inventorySupplierCreateSchema.partial();

export const bulkMaterialDeactivateSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100)
});

export const stockMovementQuerySchema = paginationQuerySchema.extend({
  itemId: optionalUuidSchema,
  projectId: optionalUuidSchema,
  movementType: z.preprocess(emptyToUndefined, movementTypeSchema.optional())
});

export const stockMovementCreateSchema = z.object({
  movementType: movementTypeSchema,
  quantity: positiveDecimalSchema,
  direction: z.enum(["increase", "decrease"]).optional(),
  unitCost: z.preprocess(emptyToUndefined, nonNegativeDecimalSchema.optional()),
  referenceType: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  referenceId: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  projectId: optionalUuidSchema,
  note: optionalTextSchema
});

export const receiptSchema = stockMovementCreateSchema.omit({ movementType: true, direction: true }).extend({
  movementType: z.literal("receipt").default("receipt")
});

export const issueSchema = stockMovementCreateSchema.omit({ movementType: true, direction: true }).extend({
  movementType: z.literal("issue").default("issue")
});

export const adjustmentSchema = stockMovementCreateSchema.omit({ movementType: true }).extend({
  movementType: z.literal("adjustment").default("adjustment"),
  direction: z.enum(["increase", "decrease"]).default("increase")
});
