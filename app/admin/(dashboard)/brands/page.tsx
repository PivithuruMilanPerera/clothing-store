import type { Metadata } from "next";
import { BrandsAdmin } from "@/components/admin/brands/BrandsAdmin";
import { getAllBrands, getAllProductsForAdmin } from "@/lib/products";

export const metadata: Metadata = {
  title: "Brands | Admin | VELVORZ",
  description: "Manage product brands.",
};

export default async function AdminBrandsPage() {
  const [brands, products] = await Promise.all([getAllBrands(), getAllProductsForAdmin()]);

  const productCounts = new Map<string, number>();
  for (const product of products) {
    const key = product.brand.trim().toLowerCase();
    productCounts.set(key, (productCounts.get(key) ?? 0) + 1);
  }

  return (
    <BrandsAdmin
      brands={brands.map((brand) => ({
        ...brand,
        productCount: productCounts.get(brand.name.trim().toLowerCase()) ?? 0,
      }))}
    />
  );
}
