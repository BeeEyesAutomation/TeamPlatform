import { z } from "zod";

const attendanceStatusSchema = z.enum(["present", "paid_leave", "unpaid_leave"]);
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const monthStringSchema = z.string().regex(/^\d{4}-\d{2}$/, "Use YYYY-MM");
const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

export const attendanceQuerySchema = z.object({
  date: dateStringSchema,
  departmentId: z.preprocess(emptyToUndefined, z.string().uuid().optional())
});

export const attendanceSaveSchema = z.object({
  date: dateStringSchema,
  departmentId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  records: z.array(
    z.object({
      employeeId: z.string().uuid(),
      status: attendanceStatusSchema.default("present"),
      note: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional())
    })
  )
});

export const attendanceMonthlyQuerySchema = z.object({
  month: monthStringSchema,
  employeeId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  departmentId: z.preprocess(emptyToUndefined, z.string().uuid().optional())
});

export const attendanceLockSchema = z.object({
  month: monthStringSchema,
  note: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional())
});

export type AttendanceStatusInput = z.infer<typeof attendanceStatusSchema>;
