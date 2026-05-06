import { z } from "zod";
import { paginationQuerySchema } from "../hr/hr.schemas";

const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);
const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());
const optionalUuid = z.preprocess(emptyToUndefined, z.string().uuid().optional());
const optionalText = z.preprocess(emptyToUndefined, z.string().trim().max(5000).optional());
const optionalShortText = z.preprocess(emptyToUndefined, z.string().trim().max(255).optional());
const money = z.coerce.number().min(0);
const quantity = z.coerce.number().min(0);
const percent = z.coerce.number().min(0).max(100);

export const idParamSchema = z.object({
  id: z.string().uuid()
});

export const projectIdParamSchema = z.object({
  projectId: z.string().uuid()
});

export const projectQuerySchema = paginationQuerySchema.extend({
  status: z.preprocess(emptyToUndefined, z.enum(["planning", "in_progress", "paused", "completed", "cancelled"]).optional())
});

export const projectCreateSchema = z.object({
  projectCode: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(255),
  customerName: optionalShortText,
  customerContactName: optionalShortText,
  customerPhone: z.preprocess(emptyToUndefined, z.string().trim().max(50).optional()),
  customerEmail: z.preprocess(emptyToUndefined, z.string().trim().email().max(255).optional()),
  customerAddress: optionalText,
  customerTaxCode: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  description: optionalText,
  managerId: optionalUuid,
  startDate: optionalDate,
  endDate: optionalDate,
  actualCompletedDate: optionalDate,
  location: optionalShortText,
  status: z.enum(["planning", "in_progress", "paused", "completed", "cancelled"]).default("planning"),
  progressPercent: percent.default(0),
  budgetEstimated: money.optional(),
  budgetActual: money.optional(),
  note: optionalText
});

export const projectUpdateSchema = projectCreateSchema.partial();
export const projectProfileUpdateSchema = projectUpdateSchema.omit({ projectCode: true });

export const planCreateSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: optionalText,
  startDate: optionalDate,
  endDate: optionalDate,
  ownerId: optionalUuid,
  progressPercent: percent.default(0),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]).default("planned"),
  sortOrder: z.coerce.number().int().min(0).default(0)
});

export const planUpdateSchema = planCreateSchema.partial();

export const taskCreateSchema = z.object({
  planId: optionalUuid,
  title: z.string().trim().min(1).max(255),
  description: optionalText,
  assigneeId: optionalUuid,
  priority: optionalShortText,
  status: z.enum(["todo", "confirmed", "in_progress", "pending_review", "completed", "cancelled"]).default("todo"),
  progressPercent: percent.default(0),
  startDate: optionalDate,
  deadline: optionalDate
});

export const taskUpdateSchema = taskCreateSchema.partial();
export const taskProgressSchema = z.object({
  progressPercent: percent,
  note: optionalText
});

export const issueCreateSchema = z.object({
  taskId: optionalUuid,
  title: z.string().trim().min(1).max(255),
  description: optionalText,
  severity: optionalShortText,
  assignedToId: optionalUuid,
  status: z.enum(["new", "in_progress", "waiting_confirmation", "resolved", "closed"]).default("new"),
  rootCause: optionalText,
  solution: optionalText,
  deadline: optionalDate
});

export const issueUpdateSchema = issueCreateSchema.partial();

export const materialCreateSchema = z.object({
  materialCode: z.string().trim().min(1).max(100),
  materialName: z.string().trim().min(1).max(255),
  unit: z.string().trim().min(1).max(50),
  plannedQuantity: quantity,
  usedQuantity: quantity.default(0),
  remainingQuantity: quantity.optional(),
  estimatedUnitPrice: money.optional(),
  actualUnitPrice: money.optional(),
  supplierName: optionalShortText,
  neededDate: optionalDate,
  status: z.enum(["not_ordered", "purchase_requested", "purchasing", "received", "issued", "shortage", "cancelled"]).default("not_ordered"),
  note: optionalText
});

export const materialUpdateSchema = materialCreateSchema.partial();

export const costCreateSchema = z.object({
  costType: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(255),
  amount: money,
  costDate: z.coerce.date(),
  note: optionalText
});

export const costUpdateSchema = costCreateSchema.partial();

export const memberCreateSchema = z.object({
  employeeId: z.string().uuid(),
  projectRole: z.string().trim().min(1).max(100),
  joinedDate: z.coerce.date(),
  leftDate: optionalDate,
  status: z.enum(["active", "inactive"]).default("active")
});

export const memberUpdateSchema = memberCreateSchema.partial();
