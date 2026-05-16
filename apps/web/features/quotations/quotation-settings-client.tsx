"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { ToolbarButton, fieldClassName } from "../../components/ui/controls";
import { ErrorBanner, InfoBanner } from "../../components/ui/feedback";
import { PageHeader } from "../../components/ui/page-header";
import { getStoredUser, hasPermission } from "../../lib/auth";
import type { QuotationCompanySettings } from "../../types/quotations";
import { fetchQuotationCompanySettings, saveQuotationCompanySettings } from "./quotations-api";

const fields: Array<{ key: keyof QuotationCompanySettings; label: string; placeholder: string }> = [
  { key: "companyName", label: "Company Name", placeholder: "Company Name" },
  { key: "taxCode", label: "Tax Code", placeholder: "Tax Code" },
  { key: "address", label: "Address", placeholder: "Address" },
  { key: "phone", label: "Phone", placeholder: "Phone" },
  { key: "email", label: "Email", placeholder: "Email" },
  { key: "bankAccountNumber", label: "Bank Account Number", placeholder: "Bank Account Number" },
  { key: "bankName", label: "Bank Name", placeholder: "Bank Name" },
  { key: "bankBranch", label: "Bank Branch", placeholder: "Bank Branch" }
];

type SettingsForm = Record<string, string>;

export function QuotationSettingsClient() {
  const user = getStoredUser();
  const canManage = hasPermission(user, "quotation_settings.manage");
  const [form, setForm] = useState<SettingsForm>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchQuotationCompanySettings()
      .then((response) => {
        const settings = response.data;
        setForm(Object.fromEntries(fields.map((field) => [field.key, settings?.[field.key] ? String(settings[field.key]) : ""])));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Cannot load company quotation settings."));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await saveQuotationCompanySettings(form);
      setMessage("Company quotation settings saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save company quotation settings.");
    }
  }

  if (!canManage) {
    return <div className="rounded-md border border-border bg-white p-5 text-sm text-muted">You do not have permission to manage quotation settings.</div>;
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Company Quotation Settings" description="Configure company header details used in quotation preview and Excel export." />
      <ErrorBanner message={error} />
      <InfoBanner message={message} />
      <form className="space-y-4 rounded-md border border-border bg-white p-4" onSubmit={(event) => void submit(event)}>
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <label key={field.key} className="text-sm font-medium">
              {field.label}
              <input className={`mt-1 w-full ${fieldClassName()}`} value={form[field.key] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} placeholder={field.placeholder} />
            </label>
          ))}
        </div>
        <div className="flex justify-end">
          <ToolbarButton variant="primary" type="submit"><Save size={16} />Save Settings</ToolbarButton>
        </div>
      </form>
    </section>
  );
}
