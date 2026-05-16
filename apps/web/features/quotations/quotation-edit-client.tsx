"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorBanner } from "../../components/ui/feedback";
import { PageHeader } from "../../components/ui/page-header";
import type { Quotation } from "../../types/quotations";
import { fetchQuotation } from "./quotations-api";
import { QuotationForm } from "./quotation-form";

export function QuotationEditClient({ id }: { id?: string }) {
  const router = useRouter();
  const [quotation, setQuotation] = useState<Quotation>();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetchQuotation(id)
      .then((response) => setQuotation(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Cannot load quotation."));
  }, [id]);

  if (id && !quotation) {
    return <ErrorBanner message={error || "Loading quotation..."} />;
  }

  return (
    <section className="space-y-6">
      <PageHeader title={id ? "Edit Quotation" : "Create Quotation"} description="Build quotation items from inventory materials and let the system calculate totals." />
      <QuotationForm quotation={quotation} onSaved={(saved) => router.push(`/quotations/${saved.id}`)} />
    </section>
  );
}
