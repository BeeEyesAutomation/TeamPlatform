import { AppShell } from "../../../../components/layout/app-shell";
import { DepartmentForm } from "../../../../features/hr/department-form";

export default function EditDepartmentPage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Sua phong ban</h1>
        <DepartmentForm id={params.id} />
      </section>
    </AppShell>
  );
}
