import {
  findMatchingProductVariant,
  getTotalInventory,
  type ProductVariantRow,
} from "@/lib/inventory";
import type { CartItem } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type OrderProductRow = {
  id: string;
  slug: string;
  name: string;
  inventory: number;
  is_published: boolean;
  product_variants: ProductVariantRow[] | null;
};

async function syncProductInventoryFromVariants(
  dbClient: SupabaseClient,
  productId: string,
): Promise<void> {
  const { data: variants } = await dbClient
    .from("product_variants")
    .select("inventory")
    .eq("product_id", productId);

  const total = getTotalInventory(variants ?? []);

  await dbClient
    .from("products")
    .update({
      inventory: total,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);
}

export async function deductInventoryForOrderItems(
  dbClient: SupabaseClient,
  items: CartItem[],
): Promise<{ success: boolean; error?: string; slugs?: string[] }> {
  if (items.length === 0) {
    return { success: true, slugs: [] };
  }

  const slugs = Array.from(new Set(items.map((item) => item.slug)));

  const { data: products, error } = await dbClient
    .from("products")
    .select(`
      id,
      slug,
      name,
      inventory,
      is_published,
      product_variants (
        id,
        color_id,
        size_id,
        inventory,
        colors ( id, name, hex ),
        sizes ( id, label )
      )
    `)
    .in("slug", slugs);

  if (error || !products) {
    return { success: false, error: "Unable to verify product inventory." };
  }

  const productMap = new Map(
    (products as OrderProductRow[]).map((product) => [product.slug, product]),
  );
  const variantProductIds = new Set<string>();

  for (const item of items) {
    const product = productMap.get(item.slug);

    if (!product || !product.is_published) {
      return {
        success: false,
        error: `"${item.name}" is no longer available.`,
      };
    }

    const variants = Array.isArray(product.product_variants)
      ? product.product_variants
      : [];

    if (variants.length > 0) {
      const matchedVariant = findMatchingProductVariant(
        variants,
        item.color,
        item.colorName,
        item.size,
      );

      if (!matchedVariant) {
        return {
          success: false,
          error: `Selected option for "${item.name}" is no longer available.`,
        };
      }

      const { data: updated, error: updateError } = await dbClient
        .from("product_variants")
        .update({ inventory: matchedVariant.inventory - item.quantity })
        .eq("id", matchedVariant.id)
        .gte("inventory", item.quantity)
        .select("id");

      if (updateError || !updated?.length) {
        const optionLabel = [item.colorName || item.color, item.size]
          .filter(Boolean)
          .join(", ");
        return {
          success: false,
          error: `Insufficient stock for "${item.name}"${optionLabel ? ` (${optionLabel})` : ""}.`,
        };
      }

      variantProductIds.add(product.id);
      continue;
    }

    const { data: updated, error: updateError } = await dbClient
      .from("products")
      .update({
        inventory: product.inventory - item.quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id)
      .gte("inventory", item.quantity)
      .select("id");

    if (updateError || !updated?.length) {
      return {
        success: false,
        error: `Insufficient stock for "${item.name}".`,
      };
    }
  }

  for (const productId of variantProductIds) {
    await syncProductInventoryFromVariants(dbClient, productId);
  }

  return { success: true, slugs };
}
