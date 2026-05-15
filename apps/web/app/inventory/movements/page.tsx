import { AppShell } from "../../../components/layout/app-shell";
import { InventoryMovementsClient } from "../../../features/inventory/inventory-movements-client";

export default function InventoryMovementsPage() {
  return (
    <AppShell>
      <InventoryMovementsClient />
    </AppShell>
  );
}
