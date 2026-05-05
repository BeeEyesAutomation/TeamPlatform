import { AppShell } from "../../../components/layout/app-shell";
import { PositionForm } from "../../../features/hr/position-form";

export default function NewPositionPage() {
  return (
    <AppShell>
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Tao chuc vu</h1>
        <PositionForm />
      </section>
    </AppShell>
  );
}
