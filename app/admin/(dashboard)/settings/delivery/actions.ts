"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { SRI_LANKA_DISTRICTS } from "@/lib/checkout-constants";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";

type Result = { success: boolean; error?: string; message?: string };

function parseMoney(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) / 100 : Number.NaN;
}

async function getClient() {
  await requireAdmin();
  if (!hasAdminCredentials()) throw new Error("Missing admin credentials.");
  return createAdminClient();
}

function revalidateDelivery() {
  revalidatePath("/admin/settings/delivery");
  revalidatePath("/checkout");
}

export async function saveShippingSettingsAction(input: {
  defaultRate: string;
  freeShippingThreshold: string;
}): Promise<Result> {
  const defaultRate = parseMoney(input.defaultRate);
  const freeShippingThreshold = parseMoney(input.freeShippingThreshold);

  if (defaultRate === null || Number.isNaN(defaultRate)) {
    return { success: false, error: "Enter a valid default delivery rate." };
  }
  if (Number.isNaN(freeShippingThreshold)) {
    return { success: false, error: "Free shipping threshold must be a positive number or blank." };
  }

  try {
    const supabase = await getClient();
    const { error } = await supabase.from("store_settings").upsert({
      key: "shipping",
      value: { defaultRate, freeShippingThreshold },
      updated_at: new Date().toISOString(),
    });
    if (error) return { success: false, error: error.message };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }

  revalidateDelivery();
  return { success: true, message: "Store delivery defaults saved." };
}

export async function saveDeliveryRateAction(input: {
  id?: string;
  areaType: "district" | "city";
  name: string;
  rate: string;
  freeShippingThreshold: string;
  estimatedDays: string;
  isActive: boolean;
}): Promise<Result> {
  const name = input.name.trim();
  const rate = parseMoney(input.rate);
  const freeShippingThreshold = parseMoney(input.freeShippingThreshold);

  if (!name) return { success: false, error: "Enter a district or city name." };
  if (rate === null || Number.isNaN(rate)) {
    return { success: false, error: "Enter a valid delivery rate." };
  }
  if (Number.isNaN(freeShippingThreshold)) {
    return { success: false, error: "Free shipping threshold must be a positive number or blank." };
  }

  const payload = {
    area_type: input.areaType === "city" ? "city" : "district",
    name,
    rate,
    free_shipping_threshold: freeShippingThreshold,
    estimated_days: input.estimatedDays.trim(),
    is_active: input.isActive,
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = await getClient();
    const { error } = input.id
      ? await supabase.from("delivery_rates").update(payload).eq("id", input.id)
      : await supabase.from("delivery_rates").insert(payload);

    if (error) {
      return {
        success: false,
        error:
          error.code === "23505"
            ? `A ${payload.area_type} rate for "${name}" already exists.`
            : error.message,
      };
    }
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }

  revalidateDelivery();
  return { success: true };
}

export async function deleteDeliveryRateAction(id: string): Promise<Result> {
  try {
    const supabase = await getClient();
    const { error } = await supabase.from("delivery_rates").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }

  revalidateDelivery();
  return { success: true };
}

/** Adds a district rate for every Sri Lankan district that doesn't have one yet. */
export async function addMissingDistrictsAction(rateInput: string): Promise<Result> {
  const rate = parseMoney(rateInput);
  if (rate === null || Number.isNaN(rate)) {
    return { success: false, error: "Enter a valid rate to apply to new districts." };
  }

  try {
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("delivery_rates")
      .select("name")
      .eq("area_type", "district");
    if (error) return { success: false, error: error.message };

    const existing = new Set((data ?? []).map((row) => String(row.name).trim().toLowerCase()));
    const rows = SRI_LANKA_DISTRICTS.filter((district) => !existing.has(district.toLowerCase())).map(
      (district) => ({ area_type: "district", name: district, rate }),
    );

    if (rows.length === 0) {
      return { success: true, message: "All 25 districts already have a rate." };
    }

    const { error: insertError } = await supabase.from("delivery_rates").insert(rows);
    if (insertError) return { success: false, error: insertError.message };

    revalidateDelivery();
    return { success: true, message: `Added ${rows.length} district rate${rows.length === 1 ? "" : "s"}.` };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
