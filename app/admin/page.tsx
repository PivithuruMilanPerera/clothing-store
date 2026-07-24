import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminProtectedShell } from "@/components/admin/AdminProtectedShell";

export const metadata: Metadata = {
  title: "Admin | VELVORZ",
  description: "VELVORZ admin dashboard.",
};

export default async function AdminPage() {
  return (
    <AdminProtectedShell>
      <AdminDashboard />
    </AdminProtectedShell>
  );
}
