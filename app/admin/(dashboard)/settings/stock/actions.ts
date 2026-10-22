"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function saveLowStockThresholdsAction(
  updates: Array<{ productId: string; threshold: number | null }>,
): Promise<{ success: boolean; error?: string; saved?: number }> {
  await requireAdmin();

  for (const update of updates) {
    if (
      update.threshold !== null &&
      (!Number.isInteger(update.threshold) || update.threshold < 0 || update.threshold > 10000)
    ) {
      return { success: false, error: "Thresholds must be whole numbers between 0 and 10,000." };
    }
  }

  const supabase = await createClient();
  const results = await Promise.all(
    updates.map((update) =>
      supabase
        .from("products")
        .update({ low_stock_threshold: update.threshold })
        .eq("id", update.productId),
    ),
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    return {
      success: false,
      error: /low_stock_threshold/.test(failed.error.message)
        ? "The low_stock_threshold column is missing. Run supabase/milestone-4-admin-migration.sql first."
        : failed.error.message,
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/settings/stock");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { success: true, saved: updates.length };
}
