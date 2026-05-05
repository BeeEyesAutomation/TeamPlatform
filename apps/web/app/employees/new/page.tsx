import { AppShell } from "../../../components/layout/app-shell";
import { EmployeeForm } from "../../../features/hr/employee-form";

export default function NewEmployeePage() {
  return (
    <AppShell>
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Tao nhan vien</h1>
        <EmployeeForm />
      </section>
    </AppShell>
  );
}
