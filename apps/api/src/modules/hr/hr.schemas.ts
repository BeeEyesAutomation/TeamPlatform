import { z } from "zod";

export const recordStatusSchema = z.enum(["active", "inactive"]);
export const employeeStatusSchema = z.enum(["probation", "active", "temporarily_inactive", "resigned"]);
export const employmentTypeSchema = z.enum(["official", "probation", "seasonal", "part_time"]);

const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.preprocess(emptyToUndefined, z.string().trim().max(255).optional())
});

export const idParamSchema = z.object({
  id: z.string().uuid()
});

export const departmentQuerySchema = paginationQuerySchema.extend({
  status: z.preprocess(emptyToUndefined, recordStatusSchema.optional())
});

export const departmentCreateSchema = z.object({
  code: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(255),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(5000).optional()),
  status: recordStatusSchema.default("active")
});

export const departmentUpdateSchema = departmentCreateSchema.partial();

export const positionQuerySchema = paginationQuerySchema.extend({
  status: z.preprocess(emptyToUndefined, recordStatusSchema.optional())
});

export const positionCreateSchema = z.object({
  code: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(255),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(5000).optional()),
  baseSalary: z.coerce.number().min(0),
  salaryStepAmount: z.coerce.number().min(0),
  status: recordStatusSchema.default("active")
});

export const positionUpdateSchema = positionCreateSchema.partial();

const optionalDateSchema = z.preprocess(
  emptyToUndefined,
  z.coerce.date().optional()
);

const optionalPhoneSchema = z.preprocess(
  emptyToUndefined,
  z.string().trim().regex(/^[0-9+\-\s().]{7,20}$/, "Invalid phone number").optional()
);

const optionalEmailSchema = z.preprocess(emptyToUndefined, z.string().trim().email().max(255).optional());
const optionalTextSchema = z.preprocess(emptyToUndefined, z.string().trim().max(5000).optional());
const optionalShortTextSchema = z.preprocess(emptyToUndefined, z.string().trim().max(255).optional());
const optionalUrlSchema = z.preprocess(emptyToUndefined, z.string().trim().url().max(2048).optional());
const optionalUuidSchema = z.preprocess(emptyToUndefined, z.string().uuid().optional());

export const employeeQuerySchema = paginationQuerySchema.extend({
  departmentId: optionalUuidSchema,
  positionId: optionalUuidSchema,
  status: z.preprocess(emptyToUndefined, employeeStatusSchema.optional())
});

export const employeeCreateSchema = z.object({
  employeeCode: z.string().trim().min(1).max(100),
  fullName: z.string().trim().min(1).max(255),
  phone: optionalPhoneSchema,
  email: optionalEmailSchema,
  dateOfBirth: optionalDateSchema,
  gender: optionalShortTextSchema,
  address: optionalTextSchema,
  avatarUrl: optionalUrlSchema,
  citizenIdNumber: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  citizenIdIssueDate: optionalDateSchema,
  citizenIdIssuePlace: optionalShortTextSchema,
  citizenIdFrontImageUrl: optionalUrlSchema,
  citizenIdBackImageUrl: optionalUrlSchema,
  bankName: optionalShortTextSchema,
  bankAccountNumber: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  bankAccountHolder: optionalShortTextSchema,
  bankBranch: optionalShortTextSchema,
  departmentId: optionalUuidSchema,
  positionId: optionalUuidSchema,
  salaryLevel: z.coerce.number().int().min(0).default(0),
  startDate: optionalDateSchema,
  employmentType: employmentTypeSchema.default("official"),
  status: employeeStatusSchema.default("active"),
  emergencyContactName: optionalShortTextSchema,
  emergencyContactPhone: optionalPhoneSchema,
  emergencyContactRelation: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  dependentCount: z.coerce.number().int().min(0).default(0)
});

export const employeeUpdateSchema = employeeCreateSchema.partial();
