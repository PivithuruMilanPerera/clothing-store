import type { Metadata } from "next";
import { ShopContent } from "@/components/shop";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { Container } from "@/components/ui";
import { getCategoryBySlug, getCategoryTree } from "@/lib/categories";
import {
  getCategoryFilterSlugs,
  mapCategoryTreeToShopFilters,
} from "@/lib/category-tree";
import {
  getPublishedShopProducts,
  getShopFilterData,
} from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop All | VELVORZ",
  description: "Browse the full VELVORZ collection.",
};

type ShopPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { category: categorySlug } = await searchParams;
  const products = await getPublishedShopProducts();
  const filterData = await getShopFilterData(products, { scope: "catalog" });

  const categoryTree = await getCategoryTree();
  const categories = mapCategoryTreeToShopFilters(categoryTree);
  const defaultCategorySlugs = categorySlug
    ? getCategoryFilterSlugs(categorySlug, categories)
    : [];

  const activeCategory = categorySlug
    ? await getCategoryBySlug(categorySlug)
    : null;
  const title = activeCategory ? activeCategory.name : "Shop All";

  return (
    <>
      <SiteHeader />
      <main className="bg-background py-10 md:py-14">
        <Container>
          <ShopContent
            title={title}
            products={products}
            categories={categories}
            sizes={filterData.sizes}
            colors={filterData.colors}
            maxShopPrice={filterData.maxPrice}
            defaultCategorySlugs={defaultCategorySlugs}
          />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
