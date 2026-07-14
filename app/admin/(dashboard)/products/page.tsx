import type { Metadata } from "next";
import { ProductsAdmin } from "@/components/admin/products/ProductsAdmin";
import { getCategoryTree } from "@/lib/categories";
import { getAllProductsForAdmin } from "@/lib/products";
import { getProductsSchemaStatus } from "@/lib/products-schema";

export const metadata: Metadata = {
  title: "Products | Admin | VELVORZ",
  description: "Manage products.",
};

export default async function AdminProductsPage() {
  const [products, categoryTree, schemaStatus] = await Promise.all([
    getAllProductsForAdmin(),
    getCategoryTree(),
    getProductsSchemaStatus(),
  ]);

  return (
    <ProductsAdmin
      products={products}
      categoryTree={categoryTree}
      schemaStatus={schemaStatus}
    />
  );
}
