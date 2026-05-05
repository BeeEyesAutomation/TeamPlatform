import {
  BadgeDollarSign,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  FileSpreadsheet,
  FolderKanban,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  Users
} from "lucide-react";
import { AppShell } from "../components/layout/app-shell";
import { ModuleCard } from "../components/module-card";

const modules = [
  {
    title: "Nhan su",
    description: "Ho so nhan vien, phong ban, chuc vu va quyen truy cap du lieu nhay cam.",
    icon: Users
  },
  {
    title: "Cham cong",
    description: "Cham cong thu cong theo ngay, tong hop thang va khoa ky cham cong.",
    icon: CalendarDays
  },
  {
    title: "Bang luong",
    description: "Luong chuc vu, phu cap, thue, bao hiem, tam ung va phieu luong.",
    icon: BadgeDollarSign
  },
  {
    title: "Du an",
    description: "Ho so du an, ke hoach, nhiem vu, van de, vat tu, chi phi va thanh vien.",
    icon: FolderKanban
  },
  {
    title: "Tai lieu du an",
    description: "Loai tai lieu, phan quyen, muc bao mat, phe duyet va nhat ky truy cap.",
    icon: BriefcaseBusiness
  },
  {
    title: "Nhap xuat",
    description: "Mau Excel, xem truoc du lieu, nhat ky import va bao cao Excel, CSV, PDF.",
    icon: FileSpreadsheet
  },
  {
    title: "Email tu dong",
    description: "Cau hinh SMTP, mau email, hang doi BullMQ va nhat ky gui mail.",
    icon: Mail
  },
  {
    title: "Bao cao",
    description: "Thong ke nhan su, tien luong, tien do, chi phi, van de va hieu suat.",
    icon: ClipboardList
  },
  {
    title: "Kiem soat",
    description: "RBAC, quyen tai lieu, audit log va cac cau hinh quan tri.",
    icon: ShieldCheck
  }
];

export default function HomePage() {
  return (
    <AppShell>
      <section className="space-y-6">
        <div className="flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <LayoutDashboard size={18} />
              Dashboard
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-ink">Company Management System</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Nen tang ban dau cho HRM, Payroll, Project Management, Project Documents, Import/Export, Reporting va Email Automation.
            </p>
          </div>
          <div className="rounded-md border border-border bg-white px-4 py-3 text-sm text-muted">
            API: <span className="font-medium text-ink">http://localhost:4000</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <ModuleCard key={module.title} {...module} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
