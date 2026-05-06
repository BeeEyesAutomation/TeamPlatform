import { AppShell } from "../../../components/layout/app-shell";
import { ProjectDetailClient } from "../../../features/projects/project-detail-client";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <ProjectDetailClient id={params.id} />
    </AppShell>
  );
}
