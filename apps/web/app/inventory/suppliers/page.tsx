import { AppShell } from "../../../components/layout/app-shell";
import { InventoryCatalogClient } from "../../../features/inventory/inventory-catalog-client";

export default function InventorySuppliersPage() {
  return (
    <AppShell>
      <InventoryCatalogClient type="suppliers" />
    </AppShell>
  );
}
