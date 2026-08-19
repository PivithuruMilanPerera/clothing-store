"use server";

import { redirect } from "next/navigation";
import { isAdminUser, sanitizeAdminRedirectPath } from "@/lib/auth";

export type AdminLoginState = {
  error?: string;
};

function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid email or password")
  ) {
    return "Invalid email or password. Please try again.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }

  if (normalized.includes("rate limit")) {
    return "Too many sign-in attempts. Please wait a few minutes and try again.";
  }

  return message;
}

export async function adminLogin(
  _prevState: AdminLoginState | null,
  formData: FormData,
): Promise<AdminLoginState> {
  try {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const redirectTo = sanitizeAdminRedirectPath(
      String(formData.get("redirect") ?? "/admin"),
    );

    if (!email || !password) {
      return { error: "Email and password are required." };
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return {
        error:
          "Authentication is not configured on this deployment. Please contact support.",
      };
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: mapAuthError(error.message) };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unable to sign in. Please try again." };
    }

    const isAdmin = await isAdminUser(supabase, user.id);

    if (!isAdmin) {
      await supabase.auth.signOut();
      return { error: "You do not have admin access." };
    }

    redirect(redirectTo);
  } catch (error) {
    const message =
      error instanceof Error ? error.message.toLowerCase() : "unknown error";

    if (
      message.includes("supabase") ||
      message.includes("fetch failed") ||
      message.includes("auth")
    ) {
      return {
        error:
          "Unable to reach authentication service right now. Please try again.",
      };
    }

    return {
      error: "Something went wrong while signing in. Please try again.",
    };
  }
}
