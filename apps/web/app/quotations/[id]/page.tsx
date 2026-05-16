import { AppShell } from "../../../components/layout/app-shell";
import { QuotationDetailClient } from "../../../features/quotations/quotation-detail-client";

export default function QuotationDetailPage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <QuotationDetailClient id={params.id} />
    </AppShell>
  );
}
