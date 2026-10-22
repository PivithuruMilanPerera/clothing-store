import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminProtectedShell } from "@/components/admin/AdminProtectedShell";
import { getDashboardData } from "@/lib/admin-analytics";
import { getCurrentAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin | VELVORZ",
  description: "VELVORZ admin dashboard.",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, data, admin] = await Promise.all([
    searchParams,
    getDashboardData(),
    getCurrentAdmin(),
  ]);

  return (
    <AdminProtectedShell>
      <AdminDashboard
        data={data}
        role={admin?.role ?? "admin"}
        forbidden={error === "forbidden"}
      />
    </AdminProtectedShell>
  );
}
