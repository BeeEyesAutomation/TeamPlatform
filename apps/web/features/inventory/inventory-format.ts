export function formatNumber(value: string | number | null | undefined, digits = 0) {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits }).format(Number.isFinite(number) ? number : 0);
}

export function formatVnd(value: string | number | null | undefined) {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number.isFinite(number) ? number : 0);
}

export function statusLabel(value: string) {
  return {
    active: "Dang dung",
    inactive: "Ngung",
    discontinued: "Ngung ban",
    receipt: "Nhap",
    issue: "Xuat",
    adjustment: "Dieu chinh",
    return: "Tra lai",
    reservation: "Giu hang",
    release: "Bo giu"
  }[value] ?? value;
}
