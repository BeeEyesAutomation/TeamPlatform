export function formatNumber(value: string | number | null | undefined, digits = 0) {
  const number = Number(String(value ?? 0).replace(/,/g, ""));
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(Number.isFinite(number) ? number : 0);
}

export function formatVnd(value: string | number | null | undefined) {
  return `${formatNumber(value, 0)} VND`;
}

export function parseFormattedNumber(value: string | number | null | undefined) {
  const normalized = String(value ?? "").replace(/,/g, "").trim();
  if (!normalized) return undefined;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : undefined;
}

export function normalizeNumericInput(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function formatInputNumber(value: string | number | null | undefined) {
  const normalized = normalizeNumericInput(String(value ?? ""));
  if (!normalized) return "";
  return formatNumber(normalized, 0);
}

export function calculateSellingPriceInput(purchasePrice: string, markupPercentage: string) {
  const purchase = parseFormattedNumber(purchasePrice);
  if (purchase === undefined) return "";
  const markup = parseFormattedNumber(markupPercentage) ?? 0;
  return formatInputNumber(Math.round(purchase * (1 + markup / 100)));
}

export function statusLabel(value: string) {
  return {
    active: "Active",
    inactive: "Inactive",
    discontinued: "Discontinued",
    receipt: "Receipt",
    issue: "Issue",
    adjustment: "Adjustment",
    return: "Return",
    reservation: "Reservation",
    release: "Release"
  }[value] ?? value;
}
