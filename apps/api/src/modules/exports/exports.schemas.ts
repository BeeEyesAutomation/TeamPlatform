import { z } from "zod";
import { paginationQuerySchema } from "../hr/hr.schemas";

export const exportQuerySchema = z.object({
  format: z.enum(["excel", "csv", "pdf"]).default("excel"),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  projectId: z.string().uuid().optional()
});

export const idParamSchema = z.object({
  id: z.string().uuid()
});

export const exportLogQuerySchema = paginationQuerySchema.extend({
  exportType: z.string().trim().optional(),
  format: z.enum(["excel", "csv", "pdf"]).optional()
});
