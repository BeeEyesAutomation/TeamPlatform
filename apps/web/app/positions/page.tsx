import { AppShell } from "../../components/layout/app-shell";
import { PositionsClient } from "../../features/hr/positions-client";

export default function PositionsPage() {
  return (
    <AppShell>
      <PositionsClient />
    </AppShell>
  );
}
