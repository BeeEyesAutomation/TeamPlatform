import { AlertCircle, Info, Inbox } from "lucide-react";

export function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="mt-0.5 shrink-0" size={16} />
      <span>{message}</span>
    </div>
  );
}

export function InfoBanner({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
      <Info className="mt-0.5 shrink-0" size={16} />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ title = "Chưa có dữ liệu", description = "Thử đổi bộ lọc hoặc tạo dữ liệu mới." }: { title?: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-white p-8 text-center">
      <Inbox size={28} className="text-muted" />
      <div className="text-sm font-semibold text-ink">{title}</div>
      <p className="max-w-md text-sm text-muted">{description}</p>
    </div>
  );
}
