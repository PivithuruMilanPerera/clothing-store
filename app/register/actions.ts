"use server";

import { redirect } from "next/navigation";

export type RegisterState = {
  error?: string;
};

function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("rate limit")) {
    return "Too many signup attempts. Please wait a few minutes and try again.";
  }

  if (
    normalized.includes("already registered") ||
    normalized.includes("already been registered")
  ) {
    return "An account with this email already exists. Please sign in.";
  }

  return message;
}

export async function registerUser(
  _prevState: RegisterState | null,
  formData: FormData,
): Promise<RegisterState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!name || !email || !password || !confirmPassword) {
    return { error: "All fields are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const { hasAdminCredentials, createAdminClient } = await import(
    "@/lib/supabase/admin"
  );

  if (hasAdminCredentials()) {
    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
      },
    });

    if (error) {
      return { error: mapAuthError(error.message) };
    }

    if (!data.user) {
      return { error: "Unable to create account. Please try again." };
    }

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: data.user.id,
        full_name: name,
        email,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      console.error("Profile upsert failed:", profileError.message);
    }
  } else {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      return { error: mapAuthError(error.message) };
    }

    if (!data.user) {
      return { error: "Unable to create account. Please try again." };
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        full_name: name,
        email,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      console.error("Profile upsert failed:", profileError.message);
    }

    if (data.session) {
      await supabase.auth.signOut();
    }
  }

  redirect("/login?registered=1");
}
