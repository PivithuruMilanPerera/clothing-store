import type { Metadata } from "next";
import { ProductCreateAdmin } from "@/components/admin/products/ProductCreateAdmin";
import { getCategoryTree } from "@/lib/categories";
import {
  getAllBrands,
  getAllColors,
  getAllSizes,
} from "@/lib/products";
import { getProductsSchemaStatus } from "@/lib/products-schema";

export const metadata: Metadata = {
  title: "Add Product | Admin | VELVORZ",
  description: "Create a new product.",
};

export default async function AdminNewProductPage() {
  const [categoryTree, schemaStatus, allColors, allSizes, allBrands] =
    await Promise.all([
      getCategoryTree(),
      getProductsSchemaStatus(),
      getAllColors(),
      getAllSizes(),
      getAllBrands(),
    ]);

  return (
    <ProductCreateAdmin
      categoryTree={categoryTree}
      schemaStatus={schemaStatus}
      allColors={allColors}
      allSizes={allSizes}
      allBrands={allBrands}
    />
  );
}
