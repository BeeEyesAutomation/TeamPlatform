import {
  BadgeDollarSign,
  CalendarDays,
  ClipboardList,
  FileText,
  FolderKanban,
  Import,
  LayoutDashboard,
  Mail,
  Settings,
  ShieldCheck,
  Users
} from "lucide-react";
import type { ReactNode } from "react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Nhan su", icon: Users },
  { label: "Cham cong", icon: CalendarDays },
  { label: "Bang luong", icon: BadgeDollarSign },
  { label: "Du an", icon: FolderKanban },
  { label: "Tai lieu", icon: FileText },
  { label: "Nhap xuat", icon: Import },
  { label: "Bao cao", icon: ClipboardList },
  { label: "Email", icon: Mail },
  { label: "Cau hinh", icon: Settings },
  { label: "Audit", icon: ShieldCheck }
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-white px-4 py-5 lg:block">
        <div className="mb-6 border-b border-border pb-4">
          <div className="text-lg font-semibold">Team Platform</div>
          <div className="text-sm text-muted">HRM + Payroll + Projects</div>
        </div>
        <nav className="space-y-1">
          {navigation.map((item) => (
            <button
              key={item.label}
              className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-muted hover:bg-surface hover:text-ink"
              type="button"
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-border bg-white/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-muted">Initial scaffold</div>
              <div className="text-base font-semibold">Module architecture placeholders</div>
            </div>
            <button
              className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-sm hover:bg-teal-800"
              type="button"
            >
              Dang nhap
            </button>
          </div>
        </header>

        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
