import { AppShell } from "../../components/layout/app-shell";
import { EmployeesClient } from "../../features/hr/employees-client";

export default function EmployeesPage() {
  return (
    <AppShell>
      <EmployeesClient />
    </AppShell>
  );
}
