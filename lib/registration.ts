import type { SupabaseClient } from "@supabase/supabase-js";

export type RegistrationFields = {
  fullName: string;
  email: string;
  phone: string;
  deliveryAddress: string;
  city: string;
  password: string;
  confirmPassword: string;
};

export async function setupRegistrationProfile(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  fields: Pick<
    RegistrationFields,
    "fullName" | "phone" | "deliveryAddress" | "city"
  >,
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

  const { data: existingAddresses } = await supabase
    .from("addresses")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (existingAddresses?.length) {
    return {};
  }

  const { error: addressError } = await supabase.from("addresses").insert({
    user_id: userId,
    label: "Home",
    full_name: fields.fullName,
    line1: fields.deliveryAddress,
    city: fields.city,
    state: "N/A",
    postal_code: "00000",
    country: "US",
    is_default: true,
  });

  if (addressError) {
    return { error: addressError.message };
  }

  return {};
}

export function parseRegistrationFields(formData: FormData): RegistrationFields {
  return {
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    deliveryAddress: String(formData.get("deliveryAddress") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
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
    !fields.deliveryAddress ||
    !fields.city ||
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
