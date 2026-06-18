import type { ProductCategory, ShopProduct, SortOption } from "@/lib/types";

export type ShopFilters = {
  categories: ProductCategory[];
  sizes: string[];
  colors: string[];
  maxPrice: number;
};

export function filterProducts(
  products: ShopProduct[],
  filters: ShopFilters,
): ShopProduct[] {
  return products.filter((product) => {
    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(product.category)
    ) {
      return false;
    }

    if (
      filters.sizes.length > 0 &&
      !product.sizes.some((size) => filters.sizes.includes(size))
    ) {
      return false;
    }

    if (
      filters.colors.length > 0 &&
      !product.colors.some((color) => filters.colors.includes(color))
    ) {
      return false;
    }

    if (product.price > filters.maxPrice) {
      return false;
    }

    return true;
  });
}

export function sortProducts(
  products: ShopProduct[],
  sort: SortOption,
): ShopProduct[] {
  const sorted = [...products];

  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "newest":
    default:
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}
