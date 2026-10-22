import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser(redirectTo = "/login") {
  const user = await getSessionUser();

  if (!user) {
    redirect(`${redirectTo}?redirect=/account`);
  }

  return user;
}

export async function isAdminUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("admins")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  return Boolean(data);
}

export async function getSessionAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const isAdmin = await isAdminUser(supabase, user.id);

  if (!isAdmin) {
    return null;
  }

  return user;
}

export async function requireAdmin(redirectTo = "/admin/login") {
  const user = await getSessionUser();

  if (!user) {
    redirect(`${redirectTo}?redirect=/admin`);
  }

  const supabase = await createClient();
  const isAdmin = await isAdminUser(supabase, user.id);

  if (!isAdmin) {
    redirect(`${redirectTo}?error=unauthorized`);
  }

  return user;
}

export type AdminRole = "admin" | "super_admin";

export type AdminRecord = {
  id: string;
  email: string;
  role: AdminRole;
  full_name: string;
};

export function normalizeAdminRole(value: unknown): AdminRole {
  return value === "super_admin" ? "super_admin" : "admin";
}

/** Loads the signed-in user's admin record. Deduplicated per request. */
export const getCurrentAdmin = cache(async (): Promise<AdminRecord | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("admins")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email ?? user.email ?? "",
    role: normalizeAdminRole(data.role),
    full_name: data.full_name ?? "",
  };
});

export async function requireSuperAdmin(): Promise<AdminRecord> {
  await requireAdmin();
  const admin = await getCurrentAdmin();

  if (!admin || admin.role !== "super_admin") {
    redirect("/admin?error=forbidden");
  }

  return admin;
}

export function sanitizeRedirectPath(path: string | null | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/account";
  }

  return path;
}

export function sanitizeAdminRedirectPath(
  path: string | null | undefined,
): string {
  if (
    !path ||
    !path.startsWith("/admin") ||
    path.startsWith("//") ||
    path === "/admin/login"
  ) {
    return "/admin";
  }

  return path;
}
