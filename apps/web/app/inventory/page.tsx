import { AppShell } from "../../components/layout/app-shell";
import { InventoryClient } from "../../features/inventory/inventory-client";

export default function InventoryPage() {
  return (
    <AppShell>
      <InventoryClient />
    </AppShell>
  );
}
