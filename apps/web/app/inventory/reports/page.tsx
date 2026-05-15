import { AppShell } from "../../../components/layout/app-shell";
import { InventoryReportsClient } from "../../../features/inventory/inventory-reports-client";

export default function InventoryReportsPage() {
  return (
    <AppShell>
      <InventoryReportsClient />
    </AppShell>
  );
}
