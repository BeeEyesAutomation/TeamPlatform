import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Team Platform",
  description: "HRM, Payroll, and Project Management dashboard"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
