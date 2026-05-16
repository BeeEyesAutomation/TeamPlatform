import { z } from "zod";
import { paginationQuerySchema } from "../hr/hr.schemas";

const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

const optionalUuidSchema = z.preprocess(emptyToUndefined, z.string().uuid().optional());
const optionalTextSchema = z.preprocess(emptyToUndefined, z.string().trim().max(5000).optional());
const optionalDateSchema = z.preprocess(emptyToUndefined, z.coerce.date().optional());
const requiredDateSchema = z.preprocess(
  emptyToUndefined,
  z.coerce.date({
    required_error: "Quotation Date is required.",
    invalid_type_error: "Quotation Date is required."
  })
);
const positiveDecimalSchema = (label: string) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({
        required_error: `${label} is required.`,
        invalid_type_error: `${label} is required.`
      })
      .positive(`${label} must be greater than 0.`)
  );
const nonNegativeDecimalSchema = (label: string) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({
        required_error: `${label} is required.`,
        invalid_type_error: `${label} is required.`
      })
      .min(0, `${label} must be non-negative.`)
  );

export const idParamSchema = z.object({
  id: z.string().uuid()
});

export const quotationStatusSchema = z.enum(["draft", "sent", "accepted", "rejected", "cancelled"]);

export const quotationQuerySchema = paginationQuerySchema.extend({
  projectId: optionalUuidSchema,
  status: z.preprocess(emptyToUndefined, quotationStatusSchema.optional()),
  dateFrom: optionalDateSchema,
  dateTo: optionalDateSchema
});

export const quotationItemInputSchema = z.object({
  materialId: z.string().uuid("Material is required."),
  quantity: positiveDecimalSchema("Quantity"),
  unitPrice: z.preprocess(emptyToUndefined, z.coerce.number().min(0, "Unit Price must be non-negative.").optional())
});

export const quotationCreateSchema = z.object({
  projectId: optionalUuidSchema,
  customerName: z.string().trim().min(1, "Customer Name is required.").max(255),
  customerRequest: optionalTextSchema,
  quotationDate: requiredDateSchema,
  numberOfSets: positiveDecimalSchema("Number of Sets"),
  vatEnabled: z.coerce.boolean().default(false),
  vatRate: nonNegativeDecimalSchema("VAT Rate").default(10),
  status: quotationStatusSchema.default("draft"),
  signatureImageUrl: z.preprocess(emptyToUndefined, z.string().trim().max(1000).optional()),
  items: z.array(quotationItemInputSchema).min(1, "At least one material item is required.")
});

export const quotationUpdateSchema = quotationCreateSchema.partial().extend({
  items: z.array(quotationItemInputSchema).min(1, "At least one material item is required.").optional()
});

export const quotationCodePreviewQuerySchema = z.object({
  date: optionalDateSchema
});
