import { AppShell } from "../../../components/layout/app-shell";
import { QuotationTemplateManagerClient } from "../../../features/quotations/quotation-template-manager-client";

export default function QuotationTemplatesPage() {
  return (
    <AppShell>
      <QuotationTemplateManagerClient />
    </AppShell>
  );
}
