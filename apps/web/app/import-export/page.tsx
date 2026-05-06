import { AppShell } from "../../components/layout/app-shell";
import { ImportExportClient } from "../../features/import-export/import-export-client";

export default function ImportExportPage() {
  return (
    <AppShell>
      <ImportExportClient />
    </AppShell>
  );
}
