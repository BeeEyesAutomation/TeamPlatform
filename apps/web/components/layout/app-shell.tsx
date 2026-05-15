import {
  BadgeDollarSign,
  CalendarDays,
  ClipboardList,
  FileText,
  FolderKanban,
  Import,
  LayoutDashboard,
  Mail,
  Package,
  Settings,
  ShieldCheck,
  Users
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const navigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Nhan su", href: "/employees", icon: Users },
  { label: "Phong ban", href: "/departments", icon: Settings },
  { label: "Chuc vu", href: "/positions", icon: ShieldCheck },
  { label: "Cham cong", href: "/attendance", icon: CalendarDays },
  { label: "Bang luong", href: "/payroll", icon: BadgeDollarSign },
  { label: "Du an", href: "/projects", icon: FolderKanban },
  { label: "Kho vat tu", href: "/inventory", icon: Package },
  { label: "Tai lieu", href: "/document-permissions", icon: FileText },
  { label: "Nhap xuat", href: "/import-export", icon: Import },
  { label: "Bao cao", href: "/reports", icon: ClipboardList },
  { label: "Email", href: "/email", icon: Mail }
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
            <Link
              key={item.label}
              href={item.href}
              className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-muted hover:bg-surface hover:text-ink"
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
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
