import type { ProductCategory, ShopProduct, SortOption } from "@/lib/types";

export type ShopFilters = {
  categories: ProductCategory[];
  sizes: string[];
  colors: string[];
  maxPrice: number;
};

function productMatchesColorFilter(
  product: ShopProduct,
  filterColors: string[],
): boolean {
  return filterColors.some((filterColor) => {
    if (product.colors.includes(filterColor)) {
      return true;
    }

    const normalizedFilter = filterColor.trim().toLowerCase();
    return (product.colorOptions ?? []).some(
      (option) =>
        option.id === filterColor ||
        option.name.trim().toLowerCase() === normalizedFilter,
    );
  });
}

export function filterProducts(
  products: ShopProduct[],
  filters: ShopFilters,
): ShopProduct[] {
  return products.filter((product) => {
    if (
      filters.categories.length > 0 &&
      !filters.categories.some((slug) => product.categorySlugs.includes(slug))
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
      !productMatchesColorFilter(product, filters.colors)
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
