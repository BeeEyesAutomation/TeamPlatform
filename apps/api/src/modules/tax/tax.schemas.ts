import { z } from "zod";
import { paginationQuerySchema, recordStatusSchema } from "../hr/hr.schemas";

const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

const decimalStringSchema = (label: string, max?: number) =>
  z.preprocess(
    emptyToUndefined,
    z.union([z.string().trim(), z.number()])
      .transform((value) => String(value))
      .refine((value) => value.length > 0 && !Number.isNaN(Number(value)), `${label} must be numeric`)
      .refine((value) => Number(value) >= 0, `${label} must be non-negative`)
      .refine((value) => max === undefined || Number(value) <= max, `${label} must be at most ${max}`)
  );

export const taxSettingQuerySchema = paginationQuerySchema.extend({
  status: z.preprocess(emptyToUndefined, recordStatusSchema.optional())
});

export const taxSettingCreateSchema = z.object({
  personalDeduction: decimalStringSchema("Personal deduction"),
  dependentDeduction: decimalStringSchema("Dependent deduction"),
  socialInsuranceRate: decimalStringSchema("Social insurance rate", 100),
  healthInsuranceRate: decimalStringSchema("Health insurance rate", 100),
  unemploymentInsuranceRate: decimalStringSchema("Unemployment insurance rate", 100),
  effectiveFrom: z.coerce.date(),
  status: recordStatusSchema.default("inactive")
});

export const taxSettingUpdateSchema = taxSettingCreateSchema.partial();

export const taxBracketQuerySchema = paginationQuerySchema.extend({
  taxSettingId: z.preprocess(emptyToUndefined, z.string().uuid().optional())
});

const taxBracketBaseSchema = z.object({
  taxSettingId: z.string().uuid(),
  level: z.coerce.number().int().min(1),
  incomeFrom: decimalStringSchema("Income from"),
  incomeTo: z.preprocess(emptyToUndefined, decimalStringSchema("Income to").optional()),
  taxRate: decimalStringSchema("Tax rate", 100)
});

export const taxBracketCreateSchema = taxBracketBaseSchema.refine((value) => value.incomeTo === undefined || Number(value.incomeTo) > Number(value.incomeFrom), {
  message: "Income to must be greater than income from",
  path: ["incomeTo"]
});

export const taxBracketUpdateSchema = taxBracketBaseSchema.partial().refine(
  (value) =>
    value.incomeFrom === undefined ||
    value.incomeTo === undefined ||
    Number(value.incomeTo) > Number(value.incomeFrom),
  {
    message: "Income to must be greater than income from",
    path: ["incomeTo"]
  }
);

export const idParamSchema = z.object({
  id: z.string().uuid()
});
