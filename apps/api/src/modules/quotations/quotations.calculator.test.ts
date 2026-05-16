import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  buildQuotationCode,
  calculateTotals,
  dateCode,
  deriveNextSequence,
  formatQuotationCode,
  money,
  quantity,
  quotationCodePrefix,
  toDecimal
} from "./quotations.calculator.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItems(amounts: number[]): Array<{ amount: Prisma.Decimal }> {
  return amounts.map((a) => ({ amount: new Prisma.Decimal(a) }));
}

// ---------------------------------------------------------------------------
// dateCode
// ---------------------------------------------------------------------------

describe("dateCode", () => {
  it("formats year month and day with zero-padding", () => {
    expect(dateCode(new Date("2026-05-01"))).toBe("20260501");
    expect(dateCode(new Date("2026-12-31"))).toBe("20261231");
    expect(dateCode(new Date("2026-01-09"))).toBe("20260109");
  });
});

// ---------------------------------------------------------------------------
// quotationCodePrefix
// ---------------------------------------------------------------------------

describe("quotationCodePrefix", () => {
  it("builds the prefix for a given date", () => {
    expect(quotationCodePrefix(new Date("2026-05-16"))).toBe("Q-20260516-");
  });
});

// ---------------------------------------------------------------------------
// deriveNextSequence
// ---------------------------------------------------------------------------

describe("deriveNextSequence", () => {
  const prefix = "Q-20260516-";

  it("returns 1 when no existing codes", () => {
    expect(deriveNextSequence(prefix, [])).toBe(1);
  });

  it("returns max sequence + 1", () => {
    expect(deriveNextSequence(prefix, ["Q-20260516-001", "Q-20260516-003", "Q-20260516-002"])).toBe(4);
  });

  it("ignores codes that do not match the 3-digit suffix pattern", () => {
    expect(deriveNextSequence(prefix, ["Q-20260516-001", "Q-20260516-abc", "Q-20260516-1234"])).toBe(2);
  });

  it("trusts caller pre-filtered by prefix — reads numeric suffix regardless of code date", () => {
    // The service filters codes with DB startsWith(prefix) before calling this.
    // deriveNextSequence itself just slices prefix.length chars and checks for \d{3}.
    // Passing an unfiltered code with the same suffix length is caller error.
    expect(deriveNextSequence(prefix, ["Q-20260516-005"])).toBe(6);
  });

  it("is not confused by partial prefix matches", () => {
    expect(deriveNextSequence(prefix, ["Q-20260516-005", "Q-202605160-001"])).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// formatQuotationCode
// ---------------------------------------------------------------------------

describe("formatQuotationCode", () => {
  it("pads sequence to 3 digits", () => {
    expect(formatQuotationCode("Q-20260516-", 1)).toBe("Q-20260516-001");
    expect(formatQuotationCode("Q-20260516-", 42)).toBe("Q-20260516-042");
    expect(formatQuotationCode("Q-20260516-", 999)).toBe("Q-20260516-999");
  });
});

// ---------------------------------------------------------------------------
// buildQuotationCode (integration of prefix + sequence + format)
// ---------------------------------------------------------------------------

describe("buildQuotationCode", () => {
  it("generates Q-YYYYMMDD-001 when no existing codes", () => {
    expect(buildQuotationCode(new Date("2026-05-16"), [])).toBe("Q-20260516-001");
  });

  it("generates next sequential code after existing ones", () => {
    const existing = ["Q-20260516-001", "Q-20260516-002"];
    expect(buildQuotationCode(new Date("2026-05-16"), existing)).toBe("Q-20260516-003");
  });

  it("fills gap but does not recycle — always takes max + 1", () => {
    const existing = ["Q-20260516-001", "Q-20260516-003"];
    expect(buildQuotationCode(new Date("2026-05-16"), existing)).toBe("Q-20260516-004");
  });

  it("starts at 001 when the existing list is empty (no codes for that day)", () => {
    expect(buildQuotationCode(new Date("2026-05-16"), [])).toBe("Q-20260516-001");
  });
});

// ---------------------------------------------------------------------------
// money / quantity precision helpers
// ---------------------------------------------------------------------------

describe("money", () => {
  it("rounds to 2 decimal places", () => {
    expect(money(new Prisma.Decimal("10.555")).toNumber()).toBe(10.56);
    expect(money(new Prisma.Decimal("10.554")).toNumber()).toBe(10.55);
    expect(money(new Prisma.Decimal("0")).toNumber()).toBe(0);
  });
});

describe("quantity", () => {
  it("rounds to 3 decimal places", () => {
    expect(quantity(new Prisma.Decimal("2.5555")).toNumber()).toBe(2.556);
    expect(quantity(new Prisma.Decimal("2.5554")).toNumber()).toBe(2.555);
  });
});

// ---------------------------------------------------------------------------
// calculateTotals
// ---------------------------------------------------------------------------

describe("calculateTotals", () => {
  it("calculates subtotal as sum of item amounts", () => {
    const items = makeItems([100_000, 200_000, 300_000]);
    const result = calculateTotals(items, 1, false, 10);
    expect(result.subtotalOneSet.toNumber()).toBe(600_000);
  });

  it("multiplies subtotal by number of sets", () => {
    const items = makeItems([500_000]);
    const result = calculateTotals(items, 3, false, 10);
    expect(result.totalBeforeVat.toNumber()).toBe(1_500_000);
  });

  it("calculates VAT amount when VAT is enabled", () => {
    const items = makeItems([1_000_000]);
    const result = calculateTotals(items, 1, true, 10);
    expect(result.vatAmount.toNumber()).toBe(100_000);
    expect(result.grandTotal.toNumber()).toBe(1_100_000);
  });

  it("zero VAT amount when VAT is disabled regardless of rate", () => {
    const items = makeItems([1_000_000]);
    const result = calculateTotals(items, 1, false, 10);
    expect(result.vatAmount.toNumber()).toBe(0);
    expect(result.grandTotal.toNumber()).toBe(1_000_000);
  });

  it("uses supplied VAT rate, not always 10%", () => {
    const items = makeItems([1_000_000]);
    const result = calculateTotals(items, 1, true, 8);
    expect(result.vatAmount.toNumber()).toBe(80_000);
    expect(result.grandTotal.toNumber()).toBe(1_080_000);
  });

  it("zero VAT rate with VAT enabled gives 0 VAT amount", () => {
    const items = makeItems([1_000_000]);
    const result = calculateTotals(items, 1, true, 0);
    expect(result.vatAmount.toNumber()).toBe(0);
    expect(result.grandTotal.toNumber()).toBe(1_000_000);
  });

  it("handles fractional sets correctly", () => {
    const items = makeItems([100_000]);
    const result = calculateTotals(items, 1.5, false, 10);
    expect(result.totalBeforeVat.toNumber()).toBe(150_000);
    expect(result.grandTotal.toNumber()).toBe(150_000);
  });

  it("full scenario — multi-item, multi-set, with VAT", () => {
    // subtotal = 300_000 + 700_000 = 1_000_000
    // totalBeforeVat = 1_000_000 * 2 = 2_000_000
    // vatAmount = 2_000_000 * 10 / 100 = 200_000
    // grandTotal = 2_200_000
    const items = makeItems([300_000, 700_000]);
    const result = calculateTotals(items, 2, true, 10);
    expect(result.subtotalOneSet.toNumber()).toBe(1_000_000);
    expect(result.totalBeforeVat.toNumber()).toBe(2_000_000);
    expect(result.vatAmount.toNumber()).toBe(200_000);
    expect(result.grandTotal.toNumber()).toBe(2_200_000);
  });

  it("returns Decimal instances, not raw numbers", () => {
    const items = makeItems([1_000]);
    const result = calculateTotals(items, 1, false, 10);
    expect(result.subtotalOneSet).toBeInstanceOf(Prisma.Decimal);
    expect(result.grandTotal).toBeInstanceOf(Prisma.Decimal);
  });

  it("handles empty item list — all totals are zero", () => {
    const result = calculateTotals([], 1, false, 10);
    expect(result.subtotalOneSet.toNumber()).toBe(0);
    expect(result.grandTotal.toNumber()).toBe(0);
  });
});
