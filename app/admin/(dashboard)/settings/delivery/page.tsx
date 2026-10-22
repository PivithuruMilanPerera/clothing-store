import type { Metadata } from "next";
import { DeliveryRatesAdmin } from "@/components/admin/settings/DeliveryRatesAdmin";
import { requireAdmin } from "@/lib/auth";
import { getDeliveryRates, getShippingSettings } from "@/lib/delivery";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Delivery Rates | Admin | VELVORZ",
  description: "Configure delivery charges by district or city.",
};

async function isDeliveryTableReady() {
  if (!hasAdminCredentials()) return false;
  const { error } = await createAdminClient().from("delivery_rates").select("id").limit(1);
  return !error;
}

export default async function AdminDeliverySettingsPage() {
  await requireAdmin();
  const [rates, settings, tableReady] = await Promise.all([
    getDeliveryRates(),
    getShippingSettings(),
    isDeliveryTableReady(),
  ]);

  return <DeliveryRatesAdmin rates={rates} settings={settings} tableReady={tableReady} />;
}
