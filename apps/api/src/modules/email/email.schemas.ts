import { z } from "zod";
import { paginationQuerySchema } from "../hr/hr.schemas";

const emptyToUndefined = (value: unknown) => value === "" || value === null ? undefined : value;

export const emailSettingsSchema = z.object({
  host: z.string().trim().min(1).max(255),
  port: z.coerce.number().int().min(1).max(65535),
  username: z.string().trim().min(1).max(255),
  password: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(5000).optional()),
  passwordEnvVar: z.preprocess(emptyToUndefined, z.string().trim().regex(/^[A-Z0-9_]+$/).optional()),
  fromEmail: z.string().trim().email().max(255),
  fromName: z.string().trim().min(1).max(255),
  encryption: z.enum(["none", "ssl", "starttls"]).default("starttls"),
  isActive: z.coerce.boolean().default(true)
}).refine((value) => value.password || value.passwordEnvVar, {
  message: "SMTP password or password environment variable is required",
  path: ["password"]
});

export const testEmailSchema = z.object({
  toEmail: z.string().trim().email().max(255)
});

export const idParamSchema = z.object({
  id: z.string().uuid()
});

export const emailTemplateUpdateSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  subject: z.string().trim().min(1).max(255).optional(),
  body: z.string().trim().min(1).max(50000).optional(),
  isActive: z.coerce.boolean().optional()
});

export const emailLogQuerySchema = paginationQuerySchema.extend({
  status: z.preprocess(emptyToUndefined, z.enum(["pending", "sent", "failed", "retrying"]).optional()),
  templateCode: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional())
});
