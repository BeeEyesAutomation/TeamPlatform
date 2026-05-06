import { AppShell } from "../../components/layout/app-shell";
import { ReportsDashboardClient } from "../../features/reports/reports-dashboard-client";

export default function ReportsPage() {
  return (
    <AppShell>
      <ReportsDashboardClient />
    </AppShell>
  );
}
