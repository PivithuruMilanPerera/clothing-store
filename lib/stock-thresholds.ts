import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Per-product low-stock thresholds keyed by product id and slug.
 * Returns an empty map when the `low_stock_threshold` column is not migrated yet.
 */
export async function getLowStockThresholdMap(
  dbClient: SupabaseClient,
  filter?: { slugs?: string[]; ids?: string[] },
): Promise<Map<string, number>> {
  const thresholds = new Map<string, number>();

  let query = dbClient
    .from("products")
    .select("id, slug, low_stock_threshold")
    .not("low_stock_threshold", "is", null);

  if (filter?.slugs) {
    if (filter.slugs.length === 0) return thresholds;
    query = query.in("slug", filter.slugs);
  }

  if (filter?.ids) {
    if (filter.ids.length === 0) return thresholds;
    query = query.in("id", filter.ids);
  }

  const { data, error } = await query;

  if (error || !data) {
    return thresholds;
  }

  for (const row of data as Array<{
    id: string;
    slug: string;
    low_stock_threshold: number | null;
  }>) {
    if (row.low_stock_threshold === null) continue;
    thresholds.set(row.id, Number(row.low_stock_threshold));
    thresholds.set(row.slug, Number(row.low_stock_threshold));
  }

  return thresholds;
}
