import { AppShell } from "../../../../components/layout/app-shell";
import { EmployeeForm } from "../../../../features/hr/employee-form";

export default function EditEmployeePage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Sua nhan vien</h1>
        <EmployeeForm id={params.id} />
      </section>
    </AppShell>
  );
}
