import { AppShell } from "../../../components/layout/app-shell";
import { QuotationEditClient } from "../../../features/quotations/quotation-edit-client";

export default function NewQuotationPage() {
  return (
    <AppShell>
      <QuotationEditClient />
    </AppShell>
  );
}
