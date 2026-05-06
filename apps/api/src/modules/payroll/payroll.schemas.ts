import { z } from "zod";
import { paginationQuerySchema } from "../hr/hr.schemas";

const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);
const monthStringSchema = z.string().regex(/^\d{4}-\d{2}$/, "Use YYYY-MM");

export const payrollCalculateSchema = z.object({
  month: monthStringSchema,
  employeeId: z.preprocess(emptyToUndefined, z.string().uuid().optional())
});

export const payrollQuerySchema = paginationQuerySchema.extend({
  month: monthStringSchema,
  employeeId: z.preprocess(emptyToUndefined, z.string().uuid().optional())
});

export const payslipQuerySchema = z.object({
  month: monthStringSchema
});

export const idParamSchema = z.object({
  id: z.string().uuid()
});
