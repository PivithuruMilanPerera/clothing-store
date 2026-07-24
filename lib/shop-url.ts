export type ShopUrlParams = {
  q?: string;
  category?: string;
  brand?: string;
};

export function buildShopHref(params: ShopUrlParams = {}): string {
  const search = new URLSearchParams();

  const q = params.q?.trim();
  if (q) {
    search.set("q", q);
  }

  const category = params.category?.trim();
  if (category) {
    search.set("category", category);
  }

  const brand = params.brand?.trim();
  if (brand) {
    search.set("brand", brand);
  }

  const query = search.toString();
  return query ? `/shop?${query}` : "/shop";
}

export function resolveShopBrand(
  brandParam: string | undefined,
  brands: string[],
): string {
  const normalized = brandParam?.trim();
  if (!normalized) {
    return "";
  }

  const match = brands.find(
    (brand) => brand.toLowerCase() === normalized.toLowerCase(),
  );

  return match ?? normalized;
}
