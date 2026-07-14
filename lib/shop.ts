import type { ProductCategory, ShopProduct, SortOption } from "@/lib/types";

export type ShopFilters = {
  query?: string;
  categories: ProductCategory[];
  brands?: string[];
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Token-aware match so "men" hits "Mens" / "mens" / "for men",
 * but not "Womens" / "women".
 */
function matchesSearchText(text: string, query: string): boolean {
  const haystack = text.trim().toLowerCase();
  const q = query.trim().toLowerCase();

  if (!q || !haystack) {
    return false;
  }

  if (haystack === q || haystack.startsWith(`${q} `) || haystack.endsWith(` ${q}`)) {
    return true;
  }

  return new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(q)}`, "i").test(haystack);
}

function productMatchesQuery(product: ShopProduct, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }

  const fields = [
    product.name,
    product.description ?? "",
    product.brand,
    ...(product.categoryLabels ?? []),
    ...product.categorySlugs,
    ...product.categorySlugs.map((slug) => slug.replace(/-/g, " ")),
  ];

  return fields.some((field) => matchesSearchText(field, q));
}

export function filterProducts(
  products: ShopProduct[],
  filters: ShopFilters,
): ShopProduct[] {
  const query = filters.query?.trim() ?? "";
  const brands = (filters.brands ?? []).map((brand) =>
    brand.trim().toLowerCase(),
  );

  return products.filter((product) => {
    if (query && !productMatchesQuery(product, query)) {
      return false;
    }

    if (
      filters.categories.length > 0 &&
      !filters.categories.some((slug) => product.categorySlugs.includes(slug))
    ) {
      return false;
    }

    if (
      brands.length > 0 &&
      !brands.includes(product.brand.trim().toLowerCase())
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
