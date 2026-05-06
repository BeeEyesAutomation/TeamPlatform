import { z } from "zod";
import { paginationQuerySchema } from "../hr/hr.schemas";

export const importTypeParamSchema = z.object({
  type: z.string().trim().min(1)
});

export const idParamSchema = z.object({
  id: z.string().uuid()
});

export const importPreviewSchema = z.object({
  fileName: z.string().trim().min(1).max(255).default("upload.json"),
  rows: z.array(z.record(z.unknown())).default([]),
  confirm: z.coerce.boolean().default(false)
});

export const importLogQuerySchema = paginationQuerySchema.extend({
  importType: z.string().trim().optional(),
  status: z.enum(["pending", "processing", "completed", "failed"]).optional()
});
