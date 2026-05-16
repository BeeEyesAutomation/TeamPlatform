import { AppShell } from "../../../components/layout/app-shell";
import { QuotationSettingsClient } from "../../../features/quotations/quotation-settings-client";

export default function QuotationSettingsPage() {
  return (
    <AppShell>
      <QuotationSettingsClient />
    </AppShell>
  );
}
