const toneClasses = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-red-200 bg-red-50 text-red-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  slate: "border-slate-200 bg-slate-50 text-slate-700"
};

const labels: Record<string, string> = {
  active: "Đang hoạt động",
  inactive: "Ngừng hoạt động",
  probation: "Thử việc",
  temporarily_inactive: "Tạm nghỉ",
  resigned: "Đã nghỉ",
  present: "Có mặt",
  paid_leave: "Nghỉ có lương",
  unpaid_leave: "Nghỉ không lương",
  draft: "Nháp",
  finalized: "Đã chốt",
  published: "Đã phát hành",
  locked: "Đã khóa",
  pending: "Đang chờ",
  sent: "Đã gửi",
  failed: "Thất bại",
  retrying: "Đang thử lại",
  open: "Đang mở",
  closed: "Đã đóng",
  completed: "Hoàn thành",
  in_progress: "Đang xử lý",
  approved: "Đã duyệt",
  rejected: "Từ chối"
};

function toneFor(value: string): keyof typeof toneClasses {
  if (["active", "present", "sent", "completed", "approved", "published"].includes(value)) return "green";
  if (["pending", "draft", "probation", "in_progress", "retrying"].includes(value)) return "amber";
  if (["failed", "rejected", "resigned"].includes(value)) return "red";
  if (["locked", "closed", "finalized"].includes(value)) return "blue";
  return "slate";
}

export function statusLabel(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  const text = String(value);
  return labels[text] ?? text.replaceAll("_", " ");
}

export function StatusBadge({ value }: { value: string | number | null | undefined }) {
  const text = value === null || value === undefined ? "" : String(value);
  return (
    <span className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-medium ${toneClasses[toneFor(text)]}`}>
      <span className="truncate">{statusLabel(value)}</span>
    </span>
  );
}
