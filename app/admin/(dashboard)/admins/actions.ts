"use server";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { normalizeAdminRole, requireSuperAdmin, type AdminRole } from "@/lib/auth";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";

export type AdminAccountResult = { success: boolean; error?: string; message?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function revalidate() {
  revalidatePath("/admin/admins");
}

async function findAuthUserByEmail(admin: SupabaseClient, email: string): Promise<User | null> {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 500 });
    if (error) return null;
    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < 500) return null;
  }
  return null;
}

async function countSuperAdmins(admin: SupabaseClient) {
  const { count } = await admin
    .from("admins")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin");
  return count ?? 0;
}

function roleColumnError(message: string) {
  return /column .*(role|full_name)/i.test(message)
    ? "Admin roles are not set up yet. Run supabase/milestone-4-admin-migration.sql first."
    : message;
}

export async function createAdminAccountAction(input: {
  email: string;
  fullName: string;
  password: string;
  role: AdminRole;
}): Promise<AdminAccountResult> {
  await requireSuperAdmin();
  if (!hasAdminCredentials()) return { success: false, error: "Missing admin credentials." };

  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const role = normalizeAdminRole(input.role);

  if (!EMAIL_PATTERN.test(email)) return { success: false, error: "Enter a valid email." };
  if (!fullName) return { success: false, error: "Name is required." };

  const admin = createAdminClient();
  const { data: existingAdmin } = await admin
    .from("admins")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existingAdmin) return { success: false, error: "That email is already an admin." };

  let user = await findAuthUserByEmail(admin, email);
  let message = "Admin account created.";

  if (user) {
    message = "Existing account granted admin access. Their password was not changed.";
  } else {
    if (input.password.length < MIN_PASSWORD_LENGTH) {
      return {
        success: false,
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      };
    }
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
      app_metadata: { velvorz_staff: true },
    });
    if (error || !data.user) {
      return { success: false, error: error?.message || "Unable to create login." };
    }
    user = data.user;
  }

  const { error } = await admin.from("admins").insert({
    id: user.id,
    email,
    full_name: fullName,
    role,
  });

  if (error) {
    if (user.app_metadata?.velvorz_staff && message === "Admin account created.") {
      await admin.auth.admin.deleteUser(user.id);
    }
    return { success: false, error: roleColumnError(error.message) };
  }

  revalidate();
  return { success: true, message };
}

export async function updateAdminAccountAction(input: {
  id: string;
  fullName: string;
  role: AdminRole;
  password?: string;
}): Promise<AdminAccountResult> {
  const current = await requireSuperAdmin();
  if (!hasAdminCredentials()) return { success: false, error: "Missing admin credentials." };

  const fullName = input.fullName.trim();
  const role = normalizeAdminRole(input.role);
  if (!fullName) return { success: false, error: "Name is required." };

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("admins")
    .select("id, role")
    .eq("id", input.id)
    .maybeSingle();
  if (!target) return { success: false, error: "Admin not found." };

  if (normalizeAdminRole(target.role) === "super_admin" && role !== "super_admin") {
    if (target.id === current.id) {
      return { success: false, error: "You can't remove your own super admin role." };
    }
    if ((await countSuperAdmins(admin)) <= 1) {
      return { success: false, error: "At least one super admin is required." };
    }
  }

  if (input.password) {
    if (input.password.length < MIN_PASSWORD_LENGTH) {
      return {
        success: false,
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      };
    }
    const { error } = await admin.auth.admin.updateUserById(input.id, {
      password: input.password,
    });
    if (error) return { success: false, error: error.message };
  }

  const { error } = await admin
    .from("admins")
    .update({ full_name: fullName, role, updated_at: new Date().toISOString() })
    .eq("id", input.id);
  if (error) return { success: false, error: roleColumnError(error.message) };

  revalidate();
  return { success: true, message: "Admin updated." };
}

export async function deleteAdminAccountAction(id: string): Promise<AdminAccountResult> {
  const current = await requireSuperAdmin();
  if (!hasAdminCredentials()) return { success: false, error: "Missing admin credentials." };
  if (id === current.id) return { success: false, error: "You can't delete your own account." };

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("admins")
    .select("id, role")
    .eq("id", id)
    .maybeSingle();
  if (!target) return { success: false, error: "Admin not found." };

  if (normalizeAdminRole(target.role) === "super_admin" && (await countSuperAdmins(admin)) <= 1) {
    return { success: false, error: "At least one super admin is required." };
  }

  const { error } = await admin.from("admins").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  // Deleting an auth user cascades to their orders, so only remove logins
  // that were created here as staff accounts and never placed an order.
  const [{ data: authData }, { count: orderCount }] = await Promise.all([
    admin.auth.admin.getUserById(id),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("user_id", id),
  ]);

  if (authData.user?.app_metadata?.velvorz_staff && (orderCount ?? 0) === 0) {
    const { error: deleteError } = await admin.auth.admin.deleteUser(id);
    if (!deleteError) {
      revalidate();
      return { success: true, message: "Admin account and login deleted." };
    }
  }

  revalidate();
  return {
    success: true,
    message: "Admin access removed. Their customer account was kept.",
  };
}
