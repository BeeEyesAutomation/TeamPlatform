import { describe, expect, it } from "vitest";
import { renderTemplate, resolveSmtpPassword, sanitizePayrollEmailPayload } from "./email.renderer.js";

describe("email renderer", () => {
  it("renders template variables without sending SMTP", () => {
    expect(renderTemplate("Task {{taskTitle}} assigned to {{employeeName}}", {
      taskTitle: "Site survey",
      employeeName: "Nguyen Van A"
    })).toBe("Task Site survey assigned to Nguyen Van A");
  });

  it("resolves SMTP password environment references", () => {
    expect(resolveSmtpPassword("env:SMTP_PASSWORD", { SMTP_PASSWORD: "secret" })).toBe("secret");
  });

  it("removes sensitive payroll details from queued payroll payloads", () => {
    expect(sanitizePayrollEmailPayload({
      employeeName: "Nguyen Van A",
      month: "2026-05",
      netSalary: "10000000",
      bankAccountNumber: "123"
    })).toEqual({
      employeeName: "Nguyen Van A",
      month: "2026-05"
    });
  });
});
