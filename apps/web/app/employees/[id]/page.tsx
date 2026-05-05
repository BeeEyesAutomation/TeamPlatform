import { AppShell } from "../../../components/layout/app-shell";
import { EmployeeDetailClient } from "../../../features/hr/employee-detail-client";

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <EmployeeDetailClient id={params.id} />
    </AppShell>
  );
}
