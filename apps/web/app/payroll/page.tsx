import { AppShell } from "../../components/layout/app-shell";
import { PayrollClient } from "../../features/payroll/payroll-client";

export default function PayrollPage() {
  return (
    <AppShell>
      <PayrollClient />
    </AppShell>
  );
}
