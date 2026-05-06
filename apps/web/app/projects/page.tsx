import { AppShell } from "../../components/layout/app-shell";
import { ProjectsClient } from "../../features/projects/projects-client";

export default function ProjectsPage() {
  return (
    <AppShell>
      <ProjectsClient />
    </AppShell>
  );
}
