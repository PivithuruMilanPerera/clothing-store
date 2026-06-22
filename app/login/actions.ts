"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminUser, sanitizeRedirectPath } from "@/lib/auth";

export type LoginState = {
  error?: string;
};

export type ForgotPasswordState = {
  error?: string;
  success?: string;
};

async function getRequestOrigin(): Promise<string> {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${protocol}://${host}`;
  }

  return "http://localhost:3000";
}

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

export async function loginUser(
  _prevState: LoginState | null,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = sanitizeRedirectPath(
    String(formData.get("redirect") ?? "/account"),
  );

  if (!email || !password) {
    return { error: "Email and password are required." };
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

  if (user && (await isAdminUser(supabase, user.id))) {
    redirect("/admin");
  }

  redirect(redirectTo);
}

export async function requestPasswordResetByEmail(
  _prevState: ForgotPasswordState | null,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Email is required." };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const origin = await getRequestOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/account/reset-password`,
  });

  if (error) {
    const normalized = error.message.toLowerCase();

    if (normalized.includes("rate limit")) {
      return {
        error: "Too many requests. Please wait a few minutes and try again.",
      };
    }
  }

  return {
    success:
      "If an account exists for that email, you will receive a reset link shortly.",
  };
}
