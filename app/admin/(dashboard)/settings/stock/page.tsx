import type { Metadata } from "next";
import {
  StockThresholdsAdmin,
  type StockThresholdRow,
} from "@/components/admin/settings/StockThresholdsAdmin";
import { getProductStockState, LOW_STOCK_THRESHOLD, resolveLowStockThreshold } from "@/lib/inventory";
import { getAllProductsForAdmin } from "@/lib/products";

export const metadata: Metadata = {
  title: "Stock Thresholds | Admin | VELVORZ",
  description: "Configure low-stock alert thresholds per product.",
};

export default async function AdminStockSettingsPage() {
  const products = await getAllProductsForAdmin();

  const rows: StockThresholdRow[] = products.map((product) => {
    const threshold = resolveLowStockThreshold(product.low_stock_threshold);
    const variants = product.variants ?? [];
    const stock = variants.length
      ? getProductStockState(variants, threshold)
      : {
          totalInventory: Number(product.inventory ?? 0),
          isOutOfStock: Number(product.inventory ?? 0) <= 0,
          isLowStock:
            Number(product.inventory ?? 0) > 0 && Number(product.inventory ?? 0) <= threshold,
        };

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images[0]?.url ?? null,
      isPublished: product.is_published,
      totalInventory: stock.totalInventory,
      lowestVariantInventory: variants.length
        ? Math.min(...variants.map((variant) => variant.inventory))
        : Number(product.inventory ?? 0),
      threshold: product.low_stock_threshold ?? null,
      state: stock.isOutOfStock ? "out" : stock.isLowStock ? "low" : "ok",
    };
  });

  return <StockThresholdsAdmin rows={rows} defaultThreshold={LOW_STOCK_THRESHOLD} />;
}
