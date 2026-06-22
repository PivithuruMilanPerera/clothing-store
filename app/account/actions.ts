"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminUser, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Address, Order, Profile, ReturnRequest } from "@/lib/types";

export type ActionState = {
  error?: string;
  success?: string;
};

async function getSupabaseForUser() {
  const user = await requireUser();
  const supabase = await createClient();

  if (await isAdminUser(supabase, user.id)) {
    redirect("/admin");
  }

  return { user, supabase };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

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

export async function updatePassword(
  _prevState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await getSupabaseForUser();

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || !confirmPassword) {
    return { error: "Both password fields are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "Unable to update password. Please try again." };
  }

  revalidatePath("/account/settings");
  revalidatePath("/account/reset-password");
  return { success: "Password updated successfully." };
}

export async function requestPasswordReset(
  _prevState: ActionState | null,
): Promise<ActionState> {
  const { user, supabase } = await getSupabaseForUser();
  const email = user.email;

  if (!email) {
    return { error: "No email associated with this account." };
  }

  const origin = await getRequestOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/account/reset-password`,
  });

  if (error) {
    return { error: "Unable to send reset email. Please try again." };
  }

  return { success: "Check your email for a password reset link." };
}

export async function getProfile(): Promise<Profile | null> {
  const { user, supabase } = await getSupabaseForUser();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, created_at, updated_at")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Failed to load profile:", error.message);
    return null;
  }

  return data;
}

export async function updateProfile(
  _prevState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const { user, supabase } = await getSupabaseForUser();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!fullName) {
    return { error: "Full name is required." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone: phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Unable to update profile. Please try again." };
  }

  revalidatePath("/account/profile");
  return { success: "Profile updated successfully." };
}

export async function getAddresses(): Promise<Address[]> {
  const { user, supabase } = await getSupabaseForUser();

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load addresses:", error.message);
    return [];
  }

  return data ?? [];
}

export async function saveAddress(
  _prevState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const { user, supabase } = await getSupabaseForUser();

  const addressId = String(formData.get("addressId") ?? "").trim();
  const label = String(formData.get("label") ?? "Home").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const line1 = String(formData.get("line1") ?? "").trim();
  const line2 = String(formData.get("line2") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const country = String(formData.get("country") ?? "Sri Lanka").trim();
  const isDefault = formData.get("isDefault") === "on";

  if (!fullName || !line1 || !city || !state || !postalCode) {
    return { error: "Please fill in all required address fields." };
  }

  if (isDefault) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }

  const payload = {
    user_id: user.id,
    label,
    full_name: fullName,
    line1,
    line2: line2 || null,
    city,
    state,
    postal_code: postalCode,
    country,
    is_default: isDefault,
    updated_at: new Date().toISOString(),
  };

  const { error } = addressId
    ? await supabase.from("addresses").update(payload).eq("id", addressId).eq("user_id", user.id)
    : await supabase.from("addresses").insert(payload);

  if (error) {
    return { error: "Unable to save address. Please try again." };
  }

  revalidatePath("/account/addresses");
  return { success: addressId ? "Address updated." : "Address added." };
}

export async function deleteAddress(addressId: string): Promise<ActionState> {
  const { user, supabase } = await getSupabaseForUser();

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Unable to delete address. Please try again." };
  }

  revalidatePath("/account/addresses");
  return { success: "Address removed." };
}

export async function deleteAddressFromForm(
  formData: FormData,
): Promise<void> {
  const addressId = String(formData.get("addressId") ?? "");
  await deleteAddress(addressId);
}

export async function getOrders(): Promise<Order[]> {
  const { user, supabase } = await getSupabaseForUser();

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load orders:", error.message);
    return [];
  }

  return (data ?? []) as Order[];
}

export async function getReturnRequests(): Promise<ReturnRequest[]> {
  const { user, supabase } = await getSupabaseForUser();

  const { data, error } = await supabase
    .from("return_requests")
    .select("*, orders(order_number, created_at)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load return requests:", error.message);
    return [];
  }

  return (data ?? []) as ReturnRequest[];
}

export async function getEligibleReturnOrders(): Promise<Order[]> {
  const orders = await getOrders();

  return orders.filter((order) =>
    ["delivered", "shipped"].includes(order.status),
  );
}

export async function createReturnRequest(
  _prevState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const { user, supabase } = await getSupabaseForUser();

  const orderId = String(formData.get("orderId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();

  if (!orderId || !reason) {
    return { error: "Please select an order and provide a reason." };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (orderError || !order) {
    return { error: "Selected order was not found." };
  }

  if (!["delivered", "shipped"].includes(order.status)) {
    return { error: "This order is not eligible for a return request." };
  }

  const { data: existing } = await supabase
    .from("return_requests")
    .select("id")
    .eq("order_id", orderId)
    .eq("user_id", user.id)
    .neq("status", "rejected")
    .maybeSingle();

  if (existing) {
    return { error: "A return request already exists for this order." };
  }

  const { error } = await supabase.from("return_requests").insert({
    user_id: user.id,
    order_id: orderId,
    reason,
    details: details || null,
  });

  if (error) {
    return { error: "Unable to submit return request. Please try again." };
  }

  revalidatePath("/account/returns");
  return { success: "Return request submitted. We will review it shortly." };
}
