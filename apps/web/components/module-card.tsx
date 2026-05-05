import type { LucideIcon } from "lucide-react";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function ModuleCard({ title, description, icon: Icon }: ModuleCardProps) {
  return (
    <article className="rounded-md border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-teal-50 text-primary">
          <Icon size={20} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        </div>
      </div>
    </article>
  );
}
