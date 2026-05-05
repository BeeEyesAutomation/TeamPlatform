import { AppShell } from "../../../components/layout/app-shell";
import { DepartmentForm } from "../../../features/hr/department-form";

export default function NewDepartmentPage() {
  return (
    <AppShell>
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Tao phong ban</h1>
        <DepartmentForm />
      </section>
    </AppShell>
  );
}
