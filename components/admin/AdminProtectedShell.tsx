import type { ReactNode } from "react";
import { adminSignOut } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/AdminShell";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { getCurrentAdmin, requireAdmin } from "@/lib/auth";

type AdminProtectedShellProps = {
  children: ReactNode;
};

export async function AdminProtectedShell({ children }: AdminProtectedShellProps) {
  const user = await requireAdmin();
  const admin = await getCurrentAdmin();

  return (
    <AdminShell
      adminEmail={admin?.email ?? user.email}
      role={admin?.role ?? "admin"}
      signOutAction={adminSignOut}
    >
      <StoreProvider>{children}</StoreProvider>
    </AdminShell>
  );
}
