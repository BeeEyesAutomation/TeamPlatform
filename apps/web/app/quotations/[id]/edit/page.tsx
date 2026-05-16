import { AppShell } from "../../../../components/layout/app-shell";
import { QuotationEditClient } from "../../../../features/quotations/quotation-edit-client";

export default function EditQuotationPage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <QuotationEditClient id={params.id} />
    </AppShell>
  );
}
