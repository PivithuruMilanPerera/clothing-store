import type { Metadata } from "next";
import {
  ProductsAdmin,
  type ProductStockFilter,
} from "@/components/admin/products/ProductsAdmin";
import { getCategoryTree } from "@/lib/categories";
import type { CategoryTreeNode } from "@/lib/category-types";
import {
  getAllBrands,
  getAllColors,
  getAllSizes,
  getAllProductsForAdmin,
} from "@/lib/products";
import { getProductsSchemaStatus } from "@/lib/products-schema";

export const metadata: Metadata = {
  title: "Products | Admin | VELVORZ",
  description: "Manage products.",
};

const STOCK_FILTERS: ProductStockFilter[] = [
  "all",
  "in-stock",
  "low-stock",
  "out-of-stock",
];

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stock?: string }>;
}) {
  const { q, stock } = await searchParams;
  const initialStockFilter = STOCK_FILTERS.find((value) => value === stock) ?? "all";

  const [products, categoryTree, schemaStatus, allColors, allSizes, allBrands] =
    await Promise.all([
      getAllProductsForAdmin(),
      getCategoryTree(),
      getProductsSchemaStatus(),
      getAllColors(),
      getAllSizes(),
      getAllBrands(),
    ]);

  return (
    <ProductsAdmin
      products={products}
      categoryTree={categoryTree}
      schemaStatus={schemaStatus}
      allColors={allColors}
      allSizes={allSizes}
      allBrands={allBrands}
      initialSearch={typeof q === "string" ? q : ""}
      initialStockFilter={initialStockFilter}
    />
  );
}
