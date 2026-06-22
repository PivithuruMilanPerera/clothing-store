import type { Metadata } from "next";
import type { ReactNode } from "react";
import { adminSignOut } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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
  const user = await requireAdmin();
  const supabase = await createClient();

  const { data: admin } = await supabase
    .from("admins")
    .select("email")
    .eq("id", user.id)
    .single();

  return (
    <AdminShell adminEmail={admin?.email} signOutAction={adminSignOut}>
      <StoreProvider>{children}</StoreProvider>
    </AdminShell>
  );
}
