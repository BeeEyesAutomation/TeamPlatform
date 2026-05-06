import { z } from "zod";
import { paginationQuerySchema, recordStatusSchema } from "../hr/hr.schemas";

const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

const decimalStringSchema = (label: string) =>
  z.preprocess(
    emptyToUndefined,
    z.union([z.string().trim(), z.number()])
      .transform((value) => String(value))
      .refine((value) => value.length > 0 && !Number.isNaN(Number(value)), `${label} must be numeric`)
      .refine((value) => Number(value) >= 0, `${label} must be non-negative`)
  );

export const allowanceCalculationTypeSchema = z.enum([
  "fixed_monthly",
  "per_working_day",
  "attendance_rate",
  "manual_bonus",
  "project_bonus",
  "deduction"
]);

export const applyScopeSchema = z.enum(["company", "department", "position", "employee"]);

export const allowanceTypeQuerySchema = paginationQuerySchema.extend({
  status: z.preprocess(emptyToUndefined, recordStatusSchema.optional()),
  calculationType: z.preprocess(emptyToUndefined, allowanceCalculationTypeSchema.optional()),
  applyScope: z.preprocess(emptyToUndefined, applyScopeSchema.optional())
});

export const allowanceTypeCreateSchema = z.object({
  code: z.string().trim().min(1).max(100).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(1).max(255),
  calculationType: allowanceCalculationTypeSchema,
  amount: decimalStringSchema("Amount"),
  unit: z.preprocess(emptyToUndefined, z.string().trim().max(50).optional()),
  isTaxable: z.coerce.boolean().default(false),
  isInsuranceBased: z.coerce.boolean().default(false),
  applyScope: applyScopeSchema.default("company"),
  status: recordStatusSchema.default("active"),
  metadata: z.preprocess(emptyToUndefined, z.record(z.unknown()).optional())
});

export const allowanceTypeUpdateSchema = allowanceTypeCreateSchema.partial();

export const idParamSchema = z.object({
  id: z.string().uuid()
});

