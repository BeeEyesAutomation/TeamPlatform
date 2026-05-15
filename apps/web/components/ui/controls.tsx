import type { ButtonHTMLAttributes, ReactNode } from "react";

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 rounded-md border border-border bg-white p-4 md:grid-cols-4 xl:grid-cols-6">{children}</div>;
}

export function ToolbarButton({ children, variant = "secondary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const classes =
    variant === "primary"
      ? "bg-primary text-white hover:bg-teal-800 disabled:bg-slate-300"
      : variant === "danger"
        ? "border border-red-200 bg-white text-red-700 hover:bg-red-50"
        : "border border-border bg-white text-ink hover:bg-surface";

  return (
    <button className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold ${classes} ${className}`} type="button" {...props}>
      {children}
    </button>
  );
}

export function fieldClassName(extra = "") {
  return `h-10 rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-slate-100 ${extra}`;
}
