import type { Metadata } from "next";
import { ProductsAdmin } from "@/components/admin/products/ProductsAdmin";
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

export default async function AdminProductsPage() {
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
    />
  );
}
