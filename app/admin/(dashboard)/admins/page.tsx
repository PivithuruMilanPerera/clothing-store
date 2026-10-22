import type { Metadata } from "next";
import { AdminAccountsAdmin, type AdminAccountRow } from "@/components/admin/admins/AdminAccountsAdmin";
import { normalizeAdminRole, requireSuperAdmin } from "@/lib/auth";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Admin Accounts | Super Admin | VELVORZ",
  description: "Manage admin accounts and roles.",
};

export default async function AdminAccountsPage() {
  const current = await requireSuperAdmin();

  let rows: AdminAccountRow[] = [];
  let error: string | null = null;

  if (!hasAdminCredentials()) {
    error = "SUPABASE_SERVICE_ROLE_KEY is required to manage admin accounts.";
  } else {
    const admin = createAdminClient();
    const { data, error: loadError } = await admin
      .from("admins")
      .select("*")
      .order("created_at", { ascending: true });

    if (loadError) {
      error = loadError.message;
    } else {
      const lastSignIns = await Promise.all(
        (data ?? []).map(async (row) => {
          const { data: authData } = await admin.auth.admin.getUserById(row.id);
          return authData.user?.last_sign_in_at ?? null;
        }),
      );

      rows = (data ?? []).map((row, index) => ({
        id: row.id,
        email: row.email,
        fullName: row.full_name ?? "",
        role: normalizeAdminRole(row.role),
        createdAt: row.created_at ?? null,
        lastSignInAt: lastSignIns[index] ?? null,
      }));
    }
  }

  return <AdminAccountsAdmin rows={rows} currentAdminId={current.id} loadError={error} />;
}
