"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { normalizeCouponCode } from "@/lib/coupons";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";

export type CouponFormState = { error?: string; success?: string } | null;

function parseOptionalNumber(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

/** datetime-local values are entered in Sri Lanka time (UTC+05:30). */
function parseLocalDateTime(value: FormDataEntryValue | null): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = new Date(`${raw}:00+05:30`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export async function saveCoupon(
  _prev: CouponFormState,
  formData: FormData,
): Promise<CouponFormState> {
  await requireAdmin();
  if (!hasAdminCredentials()) return { error: "Missing admin credentials." };

  const id = String(formData.get("id") ?? "").trim();
  const code = normalizeCouponCode(String(formData.get("code") ?? ""));
  const discountType = formData.get("discount_type") === "fixed" ? "fixed" : "percentage";
  const discountValue = parseOptionalNumber(formData.get("discount_value"));
  const minOrder = parseOptionalNumber(formData.get("min_order_amount")) ?? 0;
  const maxDiscount = parseOptionalNumber(formData.get("max_discount_amount"));
  const usageLimit = parseOptionalNumber(formData.get("usage_limit"));
  const startsAt = parseLocalDateTime(formData.get("starts_at"));
  const expiresAt = parseLocalDateTime(formData.get("expires_at"));

  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
    return { error: "Code must be 3–32 characters: letters, numbers, dashes or underscores." };
  }
  if (discountValue === null || Number.isNaN(discountValue) || discountValue <= 0) {
    return { error: "Enter a discount value greater than zero." };
  }
  if (discountType === "percentage" && discountValue > 100) {
    return { error: "Percentage discounts cannot exceed 100%." };
  }
  if (Number.isNaN(minOrder) || minOrder < 0) {
    return { error: "Minimum order amount must be zero or more." };
  }
  if (maxDiscount !== null && (Number.isNaN(maxDiscount) || maxDiscount <= 0)) {
    return { error: "Maximum discount must be greater than zero." };
  }
  if (
    usageLimit !== null &&
    (Number.isNaN(usageLimit) || usageLimit < 1 || !Number.isInteger(usageLimit))
  ) {
    return { error: "Usage limit must be a whole number of 1 or more." };
  }
  if (startsAt && expiresAt && startsAt >= expiresAt) {
    return { error: "Expiry must be after the start date." };
  }

  const payload = {
    code,
    description: String(formData.get("description") ?? "").trim(),
    discount_type: discountType,
    discount_value: discountValue,
    min_order_amount: minOrder,
    max_discount_amount: discountType === "percentage" ? maxDiscount : null,
    usage_limit: usageLimit,
    starts_at: startsAt,
    expires_at: expiresAt,
    is_active: formData.get("is_active") === "on",
    updated_at: new Date().toISOString(),
  };

  const supabase = createAdminClient();
  const { error } = id
    ? await supabase.from("coupons").update(payload).eq("id", id)
    : await supabase.from("coupons").insert(payload);

  if (error) {
    if (error.code === "23505") {
      return { error: `A coupon with code ${code} already exists.` };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/coupons");
  return { success: id ? "Coupon updated." : `Coupon ${code} created.` };
}

export async function setCouponActive(id: string, isActive: boolean) {
  await requireAdmin();
  if (!hasAdminCredentials()) return { success: false, error: "Missing admin credentials." };

  const { error } = await createAdminClient()
    .from("coupons")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function deleteCoupon(id: string) {
  await requireAdmin();
  if (!hasAdminCredentials()) return { success: false, error: "Missing admin credentials." };

  const { error } = await createAdminClient().from("coupons").delete().eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/coupons");
  return { success: true };
}
