import { AppShell } from "../../components/layout/app-shell";
import { DocumentPermissionsClient } from "../../features/project-documents/document-permissions-client";

export default function DocumentPermissionsPage() {
  return (
    <AppShell>
      <DocumentPermissionsClient />
    </AppShell>
  );
}
