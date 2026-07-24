import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminProtectedShell } from "@/components/admin/AdminProtectedShell";

export const metadata: Metadata = {
  title: "Admin | VELVORZ",
  description: "VELVORZ admin dashboard.",
};

type AdminDashboardLayoutProps = {
  children: ReactNode;
};

export default async function AdminDashboardLayout({
  children,
}: AdminDashboardLayoutProps) {
  return <AdminProtectedShell>{children}</AdminProtectedShell>;
}
