import { AppShell } from "../../../../components/layout/app-shell";
import { InventoryDetailClient } from "../../../../features/inventory/inventory-detail-client";

export default function InventoryItemPage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <InventoryDetailClient id={params.id} />
    </AppShell>
  );
}
