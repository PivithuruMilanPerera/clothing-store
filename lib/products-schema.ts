import { createClient } from "@/lib/supabase/server";
import type { ProductsSchemaStatus } from "@/lib/products-schema-types";

export type { ProductsSchemaStatus } from "@/lib/products-schema-types";

export async function getProductsSchemaStatus(): Promise<ProductsSchemaStatus> {
  const supabase = await createClient();
  const issues: string[] = [];

  const checks = [
    {
      label: "products.price",
      run: () => supabase.from("products").select("price").limit(1),
    },
    {
      label: "products.base_price",
      run: () => supabase.from("products").select("base_price").limit(1),
    },
    {
      label: "products.discount_type",
      run: () => supabase.from("products").select("discount_type").limit(1),
    },
    {
      label: "products.discount_value",
      run: () => supabase.from("products").select("discount_value").limit(1),
    },
    {
      label: "products.inventory",
      run: () => supabase.from("products").select("inventory").limit(1),
    },
    {
      label: "product_images.url",
      run: () => supabase.from("product_images").select("url").limit(1),
    },
    {
      label: "product_images.color_id",
      run: () => supabase.from("product_images").select("color_id").limit(1),
    },
    {
      label: "product_colors.color_id",
      run: () => supabase.from("product_colors").select("color_id").limit(1),
    },
    {
      label: "product_sizes.size_id",
      run: () => supabase.from("product_sizes").select("size_id").limit(1),
    },
    {
      label: "colors",
      run: () => supabase.from("colors").select("id").limit(1),
    },
    {
      label: "brands",
      run: () => supabase.from("brands").select("id").limit(1),
    },
    {
      label: "product_variants",
      run: () => supabase.from("product_variants").select("id").limit(1),
    },
  ] as const;

  for (const check of checks) {
    const { error } = await check.run();
    if (error) {
      issues.push(check.label);
    }
  }

  return {
    ready: issues.length === 0,
    issues,
  };
}
