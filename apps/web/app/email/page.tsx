import { AppShell } from "../../components/layout/app-shell";
import { EmailAdminClient } from "../../features/email/email-admin-client";

export default function EmailPage() {
  return (
    <AppShell>
      <EmailAdminClient />
    </AppShell>
  );
}
