import { Prisma } from "@prisma/client";

export const toDecimal = (value: number | string | Prisma.Decimal) => new Prisma.Decimal(value);
export const money = (value: Prisma.Decimal) => value.toDecimalPlaces(2);
export const quantity = (value: Prisma.Decimal) => value.toDecimalPlaces(3);

export function dateCode(date: Date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

export function quotationCodePrefix(date: Date) {
  return `Q-${dateCode(date)}-`;
}

export function deriveNextSequence(prefix: string, existingCodes: string[]): number {
  return existingCodes.reduce((max, code) => {
    const suffix = code.slice(prefix.length);
    const sequence = /^\d{3}$/.test(suffix) ? Number(suffix) : 0;
    return Math.max(max, sequence);
  }, 0) + 1;
}

export function formatQuotationCode(prefix: string, sequence: number): string {
  return `${prefix}${String(sequence).padStart(3, "0")}`;
}

export function buildQuotationCode(date: Date, existingCodes: string[]): string {
  const prefix = quotationCodePrefix(date);
  const sequence = deriveNextSequence(prefix, existingCodes);
  return formatQuotationCode(prefix, sequence);
}

export function calculateTotals(
  items: Array<{ amount: Prisma.Decimal }>,
  numberOfSetsInput: number,
  vatEnabled: boolean,
  vatRateInput: number
) {
  const numberOfSets = quantity(toDecimal(numberOfSetsInput));
  const vatRate = toDecimal(vatRateInput).toDecimalPlaces(3);
  const subtotalOneSet = money(items.reduce((sum, item) => sum.add(item.amount), new Prisma.Decimal(0)));
  const totalBeforeVat = money(subtotalOneSet.mul(numberOfSets));
  const vatAmount = vatEnabled ? money(totalBeforeVat.mul(vatRate).div(100)) : new Prisma.Decimal(0);
  const grandTotal = money(totalBeforeVat.add(vatAmount));
  return { numberOfSets, vatRate, subtotalOneSet, totalBeforeVat, vatAmount, grandTotal };
}
