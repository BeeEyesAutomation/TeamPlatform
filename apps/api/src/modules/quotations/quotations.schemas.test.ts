import { describe, expect, it } from "vitest";

import {
  quotationCreateSchema,
  quotationItemInputSchema,
  quotationQuerySchema,
  quotationUpdateSchema
} from "./quotations.schemas.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validItemId = "00000000-0000-0000-0000-000000000001";
const validProjectId = "00000000-0000-0000-0000-000000000002";

function baseItem(overrides: Record<string, unknown> = {}) {
  return { materialId: validItemId, quantity: 1, ...overrides };
}

function baseCreate(overrides: Record<string, unknown> = {}) {
  return {
    quotationType: "commercial",
    customerName: "Acme Corp",
    quotationDate: "2026-05-16",
    numberOfSets: 1,
    vatEnabled: false,
    vatRate: 10,
    items: [baseItem()],
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// quotationItemInputSchema
// ---------------------------------------------------------------------------

describe("quotationItemInputSchema", () => {
  it("accepts a valid item with materialId and quantity", () => {
    expect(() => quotationItemInputSchema.parse(baseItem())).not.toThrow();
  });

  it("accepts an optional unitPrice of zero", () => {
    expect(() => quotationItemInputSchema.parse(baseItem({ unitPrice: 0 }))).not.toThrow();
  });

  it("accepts an optional positive unitPrice", () => {
    expect(() => quotationItemInputSchema.parse(baseItem({ unitPrice: 150_000 }))).not.toThrow();
  });

  it("rejects a non-uuid materialId", () => {
    const result = quotationItemInputSchema.safeParse(baseItem({ materialId: "not-a-uuid" }));
    expect(result.success).toBe(false);
  });

  it("rejects zero quantity", () => {
    const result = quotationItemInputSchema.safeParse(baseItem({ quantity: 0 }));
    expect(result.success).toBe(false);
  });

  it("rejects negative quantity", () => {
    const result = quotationItemInputSchema.safeParse(baseItem({ quantity: -1 }));
    expect(result.success).toBe(false);
  });

  it("rejects negative unitPrice", () => {
    const result = quotationItemInputSchema.safeParse(baseItem({ unitPrice: -1 }));
    expect(result.success).toBe(false);
  });

  it("coerces string quantity to number", () => {
    const result = quotationItemInputSchema.safeParse(baseItem({ quantity: "5" }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.quantity).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// quotationCreateSchema
// ---------------------------------------------------------------------------

describe("quotationCreateSchema", () => {
  it("accepts a valid commercial quotation", () => {
    expect(() => quotationCreateSchema.parse(baseCreate())).not.toThrow();
  });

  it("accepts a valid project quotation with projectId", () => {
    expect(() => quotationCreateSchema.parse(baseCreate({ quotationType: "project", projectId: validProjectId }))).not.toThrow();
  });

  it("rejects project quotation without projectId", () => {
    const result = quotationCreateSchema.safeParse(baseCreate({ quotationType: "project" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("projectId");
    }
  });

  it("rejects empty customerName", () => {
    const result = quotationCreateSchema.safeParse(baseCreate({ customerName: "" }));
    expect(result.success).toBe(false);
  });

  it("rejects zero numberOfSets", () => {
    const result = quotationCreateSchema.safeParse(baseCreate({ numberOfSets: 0 }));
    expect(result.success).toBe(false);
  });

  it("rejects negative numberOfSets", () => {
    const result = quotationCreateSchema.safeParse(baseCreate({ numberOfSets: -1 }));
    expect(result.success).toBe(false);
  });

  it("rejects empty items array", () => {
    const result = quotationCreateSchema.safeParse(baseCreate({ items: [] }));
    expect(result.success).toBe(false);
  });

  it("rejects negative vatRate", () => {
    const result = quotationCreateSchema.safeParse(baseCreate({ vatRate: -1 }));
    expect(result.success).toBe(false);
  });

  it("accepts zero vatRate", () => {
    expect(() => quotationCreateSchema.parse(baseCreate({ vatRate: 0 }))).not.toThrow();
  });

  it("defaults quotationType to commercial when not provided", () => {
    const { quotationType: _removed, ...withoutType } = baseCreate();
    const result = quotationCreateSchema.parse(withoutType);
    expect(result.quotationType).toBe("commercial");
  });

  it("defaults vatEnabled to false when not provided", () => {
    const { vatEnabled: _removed, ...withoutVat } = baseCreate();
    const result = quotationCreateSchema.parse(withoutVat);
    expect(result.vatEnabled).toBe(false);
  });

  it("defaults status to draft", () => {
    const result = quotationCreateSchema.parse(baseCreate());
    expect(result.status).toBe("draft");
  });

  it("coerces string quotation date", () => {
    const result = quotationCreateSchema.parse(baseCreate({ quotationDate: "2026-01-15" }));
    expect(result.quotationDate).toBeInstanceOf(Date);
  });

  it("rejects an invalid quotation date string", () => {
    const parsed = quotationCreateSchema.safeParse(baseCreate({ quotationDate: "not-a-date" }));
    expect(parsed.success).toBe(false);
  });

  it("rejects an unknown quotationType", () => {
    const result = quotationCreateSchema.safeParse(baseCreate({ quotationType: "internal" }));
    expect(result.success).toBe(false);
  });

  it("treats empty string projectId as undefined", () => {
    const result = quotationCreateSchema.parse(baseCreate({ projectId: "" }));
    expect(result.projectId).toBeUndefined();
  });

  it("accepts multiple items", () => {
    const items = [baseItem(), baseItem({ materialId: "00000000-0000-0000-0000-000000000003", quantity: 5 })];
    expect(() => quotationCreateSchema.parse(baseCreate({ items }))).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// quotationUpdateSchema
// ---------------------------------------------------------------------------

describe("quotationUpdateSchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    expect(() => quotationUpdateSchema.parse({})).not.toThrow();
  });

  it("accepts a partial update with only customerName", () => {
    expect(() => quotationUpdateSchema.parse({ customerName: "New Corp" })).not.toThrow();
  });

  it("rejects project type without projectId when quotationType is provided", () => {
    const result = quotationUpdateSchema.safeParse({ quotationType: "project" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("projectId");
    }
  });

  it("accepts project type when projectId is also provided", () => {
    expect(() => quotationUpdateSchema.parse({ quotationType: "project", projectId: validProjectId })).not.toThrow();
  });

  it("rejects negative numberOfSets when provided", () => {
    const result = quotationUpdateSchema.safeParse({ numberOfSets: -1 });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// quotationQuerySchema
// ---------------------------------------------------------------------------

describe("quotationQuerySchema", () => {
  it("accepts empty query", () => {
    expect(() => quotationQuerySchema.parse({})).not.toThrow();
  });

  it("accepts valid status filter", () => {
    expect(() => quotationQuerySchema.parse({ status: "approved" })).not.toThrow();
  });

  it("accepts valid quotationType filter", () => {
    expect(() => quotationQuerySchema.parse({ quotationType: "project" })).not.toThrow();
  });

  it("rejects an invalid status", () => {
    const result = quotationQuerySchema.safeParse({ status: "pending" });
    expect(result.success).toBe(false);
  });

  it("treats empty string status as undefined", () => {
    const result = quotationQuerySchema.parse({ status: "" });
    expect(result.status).toBeUndefined();
  });

  it("coerces dateFrom string to Date", () => {
    const result = quotationQuerySchema.parse({ dateFrom: "2026-01-01" });
    expect(result.dateFrom).toBeInstanceOf(Date);
  });
});
