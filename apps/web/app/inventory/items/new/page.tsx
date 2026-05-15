import { AppShell } from "../../../../components/layout/app-shell";
import { InventoryItemForm } from "../../../../features/inventory/inventory-item-form";

export default function NewInventoryItemPage() {
  return (
    <AppShell>
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Add Material</h1>
        <InventoryItemForm />
      </section>
    </AppShell>
  );
}
