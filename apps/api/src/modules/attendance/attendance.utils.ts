import { AppError } from "../../utils/app-error";

export function parseBusinessDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

export function getMonthFromDate(date: string) {
  return date.slice(0, 7);
}

export function getMonthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));
  return { start, end };
}

export function assertValidMonth(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new AppError(400, "Use YYYY-MM for month");
  }
}
