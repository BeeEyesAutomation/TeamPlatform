import { AppShell } from "../../../components/layout/app-shell";
import { PayrollDetailClient } from "../../../features/payroll/payroll-detail-client";

export default function PayrollDetailPage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <PayrollDetailClient id={params.id} />
    </AppShell>
  );
}
