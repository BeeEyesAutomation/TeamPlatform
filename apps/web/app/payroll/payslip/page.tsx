import { AppShell } from "../../../components/layout/app-shell";
import { PayslipClient } from "../../../features/payroll/payslip-client";

export default function PayslipPage() {
  return (
    <AppShell>
      <PayslipClient />
    </AppShell>
  );
}
