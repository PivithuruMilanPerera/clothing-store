import type { SupabaseClient } from "@supabase/supabase-js";

export type RegistrationFields = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export async function setupRegistrationProfile(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  fields: Pick<RegistrationFields, "fullName" | "phone">,
): Promise<{ error?: string }> {
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      full_name: fields.fullName,
      email,
      phone: fields.phone,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    return { error: profileError.message };
  }

  return {};
}

export function parseRegistrationFields(formData: FormData): RegistrationFields {
  return {
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
}

export function validateRegistrationFields(
  fields: RegistrationFields,
): string | null {
  if (
    !fields.fullName ||
    !fields.email ||
    !fields.phone ||
    !fields.password ||
    !fields.confirmPassword
  ) {
    return "All fields are required.";
  }

  if (fields.phone.length < 7) {
    return "Please enter a valid phone number.";
  }

  if (fields.password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (fields.password !== fields.confirmPassword) {
    return "Passwords do not match.";
  }

  return null;
}
