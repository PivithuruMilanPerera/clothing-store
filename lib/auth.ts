import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
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
