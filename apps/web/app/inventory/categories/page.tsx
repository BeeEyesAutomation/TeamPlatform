import { AppShell } from "../../../components/layout/app-shell";
import { InventoryCatalogClient } from "../../../features/inventory/inventory-catalog-client";

export default function InventoryCategoriesPage() {
  return (
    <AppShell>
      <InventoryCatalogClient type="categories" />
    </AppShell>
  );
}
