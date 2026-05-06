import { AppShell } from "../../../components/layout/app-shell";
import { PayrollSettingsClient } from "../../../features/payroll/payroll-settings-client";

export default function PayrollSettingsPage() {
  return (
    <AppShell>
      <PayrollSettingsClient />
    </AppShell>
  );
}

