import type { Metadata } from "next";
import { ProductCreateAdmin } from "@/components/admin/products/ProductCreateAdmin";
import { getCategoryTree } from "@/lib/categories";
import { getProductsSchemaStatus } from "@/lib/products-schema";

export const metadata: Metadata = {
  title: "Add Product | Admin | VELVORZ",
  description: "Create a new product.",
};

export default async function AdminNewProductPage() {
  const [categoryTree, schemaStatus] = await Promise.all([
    getCategoryTree(),
    getProductsSchemaStatus(),
  ]);

  return (
    <ProductCreateAdmin
      categoryTree={categoryTree}
      schemaStatus={schemaStatus}
    />
  );
}
