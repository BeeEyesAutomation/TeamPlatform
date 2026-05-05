import { AppShell } from "../../components/layout/app-shell";
import { DepartmentsClient } from "../../features/hr/departments-client";

export default function DepartmentsPage() {
  return (
    <AppShell>
      <DepartmentsClient />
    </AppShell>
  );
}
