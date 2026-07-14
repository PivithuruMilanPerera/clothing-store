import type { ReactNode } from "react";
import { adminSignOut } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/AdminShell";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type AdminProtectedShellProps = {
  children: ReactNode;
};

export async function AdminProtectedShell({ children }: AdminProtectedShellProps) {
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
