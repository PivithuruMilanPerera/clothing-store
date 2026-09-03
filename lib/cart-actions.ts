"use server";

import { findMatchingProductVariant } from "@/lib/inventory";
import { computeFinalPrice } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import type { CartItem, CartStockStatus } from "@/lib/types";

export type CartSyncResult = {
  success: boolean;
  items?: CartItem[];
  error?: string;
};

/** Checks current logged in user ID */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

/** Loads persisted cart items for the logged-in customer from Supabase */
export async function loadUserCartFromDb(): Promise<CartItem[] | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from("cart_items")
      .select("id, item_key, slug, name, image, price, color, color_name, size, quantity")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      // If table does not exist or query fails, return null gracefully
      return null;
    }

    if (!data) {
      return [];
    }

    return data.map((row) => ({
      id: row.item_key || row.id,
      slug: row.slug,
      name: row.name,
      image: row.image,
      price: Number(row.price),
      color: row.color,
      colorName: row.color_name ?? undefined,
      size: row.size,
      quantity: row.quantity,
    }));
  } catch {
    return null;
  }
}

/** Syncs customer cart to Supabase cart_items table */
export async function syncUserCartToDb(items: CartItem[]): Promise<CartSyncResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthenticated" };
    }

    if (items.length === 0) {
      await supabase.from("cart_items").delete().eq("user_id", user.id);
      return { success: true, items: [] };
    }

    // Delete items not in current list
    const currentKeys = items.map((item) => item.id);
    await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id)
      .not("item_key", "in", `(${currentKeys.map((k) => `"${k}"`).join(",")})`);

    const rows = items.map((item) => ({
      user_id: user.id,
      item_key: item.id,
      slug: item.slug,
      name: item.name,
      image: item.image,
      price: item.price,
      color: item.color,
      color_name: item.colorName ?? null,
      size: item.size,
      quantity: item.quantity,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("cart_items")
      .upsert(rows, { onConflict: "user_id,item_key" });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, items };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Validates real-time inventory and live pricing for all items in the shopping cart.
 */
export async function validateCartStock(
  items: CartItem[],
): Promise<Record<string, CartStockStatus>> {
  if (items.length === 0) {
    return {};
  }

  try {
    const supabase = await createClient();
    const slugs = Array.from(new Set(items.map((item) => item.slug)));

    const { data: products, error } = await supabase
      .from("products")
      .select(`
        id,
        slug,
        name,
        price,
        base_price,
        discount_type,
        discount_value,
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
      // Fallback: mark all as currently in-stock with item's stored price
      const fallback: Record<string, CartStockStatus> = {};
      for (const item of items) {
        fallback[item.id] = {
          id: item.id,
          slug: item.slug,
          color: item.color,
          size: item.size,
          availableStock: 999,
          isOutOfStock: false,
          isLowStock: false,
          currentPrice: item.price,
        };
      }
      return fallback;
    }

    const productMap = new Map(products.map((p) => [p.slug, p]));
    const result: Record<string, CartStockStatus> = {};

    for (const item of items) {
      const product = productMap.get(item.slug);

      if (!product || !product.is_published) {
        result[item.id] = {
          id: item.id,
          slug: item.slug,
          color: item.color,
          size: item.size,
          availableStock: 0,
          isOutOfStock: true,
          isLowStock: false,
          currentPrice: item.price,
        };
        continue;
      }

      const basePrice = Number(product.base_price ?? product.price);
      const discountType = product.discount_type as any;
      const discountValue = Number(product.discount_value ?? 0);
      const computedPrice = computeFinalPrice(basePrice, discountType, discountValue);

      const variants = Array.isArray(product.product_variants)
        ? product.product_variants
        : [];

      let availableStock = 0;

      if (variants.length > 0) {
        const matchedVariant = findMatchingProductVariant(
          variants,
          item.color,
          item.colorName,
          item.size,
        );

        if (matchedVariant) {
          availableStock = Math.max(0, matchedVariant.inventory ?? 0);
        } else {
          // If no specific variant matched, fallback to total inventory or product inventory
          const totalVariantInventory = variants.reduce(
            (sum: number, v: any) => sum + (v.inventory ?? 0),
            0,
          );
          availableStock = Math.max(0, totalVariantInventory || product.inventory || 0);
        }
      } else {
        availableStock = Math.max(0, product.inventory ?? 0);
      }

      const isOutOfStock = availableStock <= 0;
      const isLowStock = availableStock > 0 && availableStock <= 5;

      result[item.id] = {
        id: item.id,
        slug: item.slug,
        color: item.color,
        size: item.size,
        availableStock,
        isOutOfStock,
        isLowStock,
        currentPrice: computedPrice.finalPrice,
      };
    }

    return result;
  } catch {
    const fallback: Record<string, CartStockStatus> = {};
    for (const item of items) {
      fallback[item.id] = {
        id: item.id,
        slug: item.slug,
        color: item.color,
        size: item.size,
        availableStock: 999,
        isOutOfStock: false,
        isLowStock: false,
        currentPrice: item.price,
      };
    }
    return fallback;
  }
}
