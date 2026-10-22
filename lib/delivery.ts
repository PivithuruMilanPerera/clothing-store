import "server-only";

import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";


export type DeliveryAreaType = "district" | "city";

export type DeliveryRate = {
  id: string;
  area_type: DeliveryAreaType;
  name: string;
  rate: number;
  free_shipping_threshold: number | null;
  estimated_days: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ShippingSettings = {
  defaultRate: number;
  /** null disables free shipping by default. */
  freeShippingThreshold: number | null;
};

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  defaultRate: 350,
  freeShippingThreshold: 5000,
};

export type ShippingQuote = {
  shipping: number;
  baseRate: number;
  freeShippingThreshold: number | null;
  areaLabel: string | null;
  estimatedDays: string | null;
};

async function getReadClient() {
  return hasAdminCredentials() ? createAdminClient() : await createClient();
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export async function getShippingSettings(): Promise<ShippingSettings> {
  try {
    const supabase = await getReadClient();
    const { data, error } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "shipping")
      .maybeSingle();

    if (error || !data?.value) {
      return DEFAULT_SHIPPING_SETTINGS;
    }

    const value = data.value as Record<string, unknown>;
    return {
      defaultRate:
        toNumberOrNull(value.defaultRate) ?? DEFAULT_SHIPPING_SETTINGS.defaultRate,
      freeShippingThreshold: toNumberOrNull(value.freeShippingThreshold),
    };
  } catch {
    return DEFAULT_SHIPPING_SETTINGS;
  }
}

function mapDeliveryRate(row: Record<string, unknown>): DeliveryRate {
  return {
    id: String(row.id),
    area_type: row.area_type === "city" ? "city" : "district",
    name: String(row.name ?? ""),
    rate: Number(row.rate ?? 0),
    free_shipping_threshold: toNumberOrNull(row.free_shipping_threshold),
    estimated_days: String(row.estimated_days ?? ""),
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export async function getDeliveryRates(options?: {
  activeOnly?: boolean;
}): Promise<DeliveryRate[]> {
  try {
    const supabase = await getReadClient();
    let query = supabase
      .from("delivery_rates")
      .select("*")
      .order("area_type", { ascending: true })
      .order("name", { ascending: true });

    if (options?.activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error || !data) {
      return [];
    }

    return data.map(mapDeliveryRate);
  } catch {
    return [];
  }
}

function normalizeArea(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/\s+district$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolves the delivery charge for an address.
 * Match order: city rate → district rate (selected district, then city name) → store default.
 */
export function resolveShippingQuote(params: {
  rates: DeliveryRate[];
  settings: ShippingSettings;
  subtotal: number;
  city?: string | null;
  district?: string | null;
}): ShippingQuote {
  const { rates, settings, subtotal } = params;

  if (subtotal <= 0) {
    return {
      shipping: 0,
      baseRate: 0,
      freeShippingThreshold: settings.freeShippingThreshold,
      areaLabel: null,
      estimatedDays: null,
    };
  }

  const city = normalizeArea(params.city);
  const district = normalizeArea(params.district);
  const active = rates.filter((rate) => rate.is_active);

  const match =
    (city &&
      active.find(
        (rate) => rate.area_type === "city" && normalizeArea(rate.name) === city,
      )) ||
    (district &&
      active.find(
        (rate) =>
          rate.area_type === "district" && normalizeArea(rate.name) === district,
      )) ||
    (city &&
      active.find(
        (rate) =>
          rate.area_type === "district" && normalizeArea(rate.name) === city,
      )) ||
    null;

  const baseRate = match ? match.rate : settings.defaultRate;
  const freeShippingThreshold = match
    ? (match.free_shipping_threshold ?? settings.freeShippingThreshold)
    : settings.freeShippingThreshold;
  const isFree =
    freeShippingThreshold !== null && subtotal >= freeShippingThreshold;

  return {
    shipping: isFree ? 0 : baseRate,
    baseRate,
    freeShippingThreshold,
    areaLabel: match
      ? `${match.name}${match.area_type === "district" ? " District" : ""}`
      : null,
    estimatedDays: match?.estimated_days || null,
  };
}

export async function getShippingQuote(params: {
  subtotal: number;
  city?: string | null;
  district?: string | null;
}): Promise<ShippingQuote> {
  const [rates, settings] = await Promise.all([
    getDeliveryRates({ activeOnly: true }),
    getShippingSettings(),
  ]);

  return resolveShippingQuote({ rates, settings, ...params });
}
