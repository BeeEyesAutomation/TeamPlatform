import { z } from "zod";
import { paginationQuerySchema } from "../hr/hr.schemas";

const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);
const optionalUuidSchema = z.preprocess(emptyToUndefined, z.string().uuid().optional());
const optionalTextSchema = z.preprocess(emptyToUndefined, z.string().trim().max(10000).optional());
const optionalDateSchema = z.preprocess(emptyToUndefined, z.coerce.date().optional());
const requiredDateSchema = z.preprocess(
  emptyToUndefined,
  z.coerce.date({ required_error: "Quotation Date is required.", invalid_type_error: "Quotation Date is required." })
);

const positiveDecimalSchema = (label: string) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ required_error: `${label} is required.`, invalid_type_error: `${label} is required.` })
      .positive(`${label} must be greater than 0.`)
  );

const nonNegativeDecimalSchema = (label: string) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ required_error: `${label} is required.`, invalid_type_error: `${label} is required.` })
      .min(0, `${label} must be non-negative.`)
  );

export const idParamSchema = z.object({ id: z.string().uuid() });
export const versionParamSchema = z.object({ id: z.string().uuid(), versionId: z.string().uuid() });
export const quotationStatusSchema = z.enum(["draft", "sent", "approved", "rejected", "cancelled"]);
export const quotationTypeSchema = z.enum(["commercial", "project"]);

export const quotationQuerySchema = paginationQuerySchema.extend({
  projectId: optionalUuidSchema,
  quotationType: z.preprocess(emptyToUndefined, quotationTypeSchema.optional()),
  status: z.preprocess(emptyToUndefined, quotationStatusSchema.optional()),
  dateFrom: optionalDateSchema,
  dateTo: optionalDateSchema
});

export const quotationItemInputSchema = z.object({
  materialId: z.string().uuid("Material is required."),
  quantity: positiveDecimalSchema("Quantity"),
  unitPrice: z.preprocess(emptyToUndefined, z.coerce.number().min(0, "Unit Price must be non-negative.").optional())
});

const quotationBodySchema = z.object({
  quotationType: quotationTypeSchema.default("commercial"),
  projectId: optionalUuidSchema,
  customerName: z.string().trim().min(1, "Customer Name is required.").max(255),
  customerRequest: optionalTextSchema,
  content: optionalTextSchema,
  quotationDate: requiredDateSchema,
  numberOfSets: positiveDecimalSchema("Number of Sets"),
  vatEnabled: z.coerce.boolean().default(false),
  vatRate: nonNegativeDecimalSchema("VAT Rate").default(10),
  status: quotationStatusSchema.default("draft"),
  signatureImageUrl: z.preprocess(emptyToUndefined, z.string().trim().max(1000).optional()),
  items: z.array(quotationItemInputSchema).min(1, "At least one material item is required.")
});

export const quotationCreateSchema = quotationBodySchema.superRefine((value, ctx) => {
    if (value.quotationType === "project" && !value.projectId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["projectId"], message: "Project is required for Project Quotation." });
    }
  });

export const quotationUpdateSchema = quotationBodySchema.partial().superRefine((value, ctx) => {
  if (value.quotationType === "project" && !value.projectId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["projectId"], message: "Project is required for Project Quotation." });
  }
});

export const quotationCodePreviewQuerySchema = z.object({
  date: optionalDateSchema
});

export const companySettingsSchema = z.object({
  companyName: z.preprocess(emptyToUndefined, z.string().trim().max(255).optional()),
  taxCode: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  address: optionalTextSchema,
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(50).optional()),
  email: z.preprocess(emptyToUndefined, z.string().trim().email("Email must be valid.").max(255).optional()),
  bankAccountNumber: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  bankName: z.preprocess(emptyToUndefined, z.string().trim().max(255).optional()),
  bankBranch: z.preprocess(emptyToUndefined, z.string().trim().max(255).optional())
});

export const templateQuerySchema = paginationQuerySchema.extend({
  quotationId: optionalUuidSchema
});

export const templateUpdateSchema = z.object({
  name: z.string().trim().min(1, "Template Name is required.").max(255).optional(),
  quotationId: optionalUuidSchema,
  status: z.enum(["active", "inactive"]).optional()
});

export const templateMappingSchema = z.object({
  placeholderConfig: z.record(z.string().trim().min(1), z.string().trim().min(1))
});
