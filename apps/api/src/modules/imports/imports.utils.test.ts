import { describe, expect, it } from "vitest";
import { isImportType, rowsToCsv, validateRows } from "./imports.utils.js";

describe("import/export utilities", () => {
  it("recognizes supported import template types", () => {
    expect(isImportType("employees")).toBe(true);
    expect(isImportType("unknown")).toBe(false);
  });

  it("validates required row fields", () => {
    const [result] = validateRows("projects", [{ projectCode: "P001", name: "" }]);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("name is required");
  });

  it("exports rows as CSV", () => {
    expect(rowsToCsv([{ code: "A", name: "Alpha" }])).toBe('code,name\n"A","Alpha"');
  });
});
