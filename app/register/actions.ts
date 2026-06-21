"use server";

import { redirect } from "next/navigation";
import {
  parseRegistrationFields,
  setupRegistrationProfile,
  validateRegistrationFields,
} from "@/lib/registration";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";

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
  const fields = parseRegistrationFields(formData);
  const validationError = validateRegistrationFields(fields);

  if (validationError) {
    return { error: validationError };
  }

  if (hasAdminCredentials()) {
    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email: fields.email,
      password: fields.password,
      email_confirm: true,
      user_metadata: {
        full_name: fields.fullName,
        phone: fields.phone,
        delivery_address: fields.deliveryAddress,
        city: fields.city,
      },
    });

    if (error) {
      return { error: mapAuthError(error.message) };
    }

    if (!data.user) {
      return { error: "Unable to create account. Please try again." };
    }

    const { error: setupError } = await setupRegistrationProfile(
      admin,
      data.user.id,
      fields.email,
      fields,
    );

    if (setupError) {
      console.error("Registration setup failed:", setupError);
    }
  } else {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: fields.email,
      password: fields.password,
      options: {
        data: {
          full_name: fields.fullName,
          phone: fields.phone,
          delivery_address: fields.deliveryAddress,
          city: fields.city,
        },
      },
    });

    if (error) {
      return { error: mapAuthError(error.message) };
    }

    if (!data.user) {
      return { error: "Unable to create account. Please try again." };
    }

    const { error: setupError } = await setupRegistrationProfile(
      supabase,
      data.user.id,
      fields.email,
      fields,
    );

    if (setupError) {
      console.error("Registration setup failed:", setupError);
    }

    if (data.session) {
      await supabase.auth.signOut();
    }
  }

  redirect("/login?registered=1");
}
