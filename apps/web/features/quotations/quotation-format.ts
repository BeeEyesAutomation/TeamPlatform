export const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0
});

export const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 });

export function parseNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return undefined;
  const normalized = String(value).replace(/,/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function formatNumberInput(value: string | number | null | undefined) {
  const parsed = parseNumber(value);
  return parsed === undefined ? "" : numberFormatter.format(parsed);
}

export function formatMoney(value: string | number | null | undefined) {
  const parsed = parseNumber(value);
  return parsed === undefined ? "-" : vndFormatter.format(parsed);
}

export function toDateInput(value: string | Date | null | undefined) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

export function statusLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
