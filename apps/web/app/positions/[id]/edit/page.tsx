import { AppShell } from "../../../../components/layout/app-shell";
import { PositionForm } from "../../../../features/hr/position-form";

export default function EditPositionPage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Sua chuc vu</h1>
        <PositionForm id={params.id} />
      </section>
    </AppShell>
  );
}
