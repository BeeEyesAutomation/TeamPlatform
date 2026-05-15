import { AppShell } from "../../../../../components/layout/app-shell";
import { InventoryItemForm } from "../../../../../features/inventory/inventory-item-form";

export default function EditInventoryItemPage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Sua vat tu</h1>
        <InventoryItemForm id={params.id} />
      </section>
    </AppShell>
  );
}
