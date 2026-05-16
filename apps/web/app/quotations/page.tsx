import { AppShell } from "../../components/layout/app-shell";
import { QuotationsListClient } from "../../features/quotations/quotations-list-client";

export default function QuotationsPage() {
  return (
    <AppShell>
      <QuotationsListClient />
    </AppShell>
  );
}
