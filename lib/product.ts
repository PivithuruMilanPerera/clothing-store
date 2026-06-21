import { newArrivals } from "@/data/landing";
import { productDetailOverrides } from "@/data/products";
import { shopProducts } from "@/data/shop";
import type { ProductDetail, ProductImage, ShopProduct } from "@/lib/types";

const DEFAULT_DESCRIPTION =
  "Precision-crafted for everyday wear. Designed with uncompromising attention to fit, fabric, and finish.";

const DEFAULT_MATERIALS_CARE =
  "100% premium cotton. Machine wash cold with like colors. Tumble dry low. Do not bleach. Iron on low heat if needed.";

const DEFAULT_SHIPPING_RETURNS =
  "Free standard shipping on orders over Rs. 150. Express delivery available at checkout. Returns accepted within 30 days in original condition.";

export function slugFromHref(href: string): string {
  return href.replace(/^\/products\//, "");
}

function defaultImages(product: ShopProduct): ProductImage[] {
  return [{ src: product.image, alt: product.name }];
}

function toProductDetail(product: ShopProduct): ProductDetail {
  const slug = slugFromHref(product.href);
  const overrides = productDetailOverrides[slug];

  return {
    ...product,
    slug,
    description: overrides?.description ?? DEFAULT_DESCRIPTION,
    images: overrides?.images ?? defaultImages(product),
    materialsCare: overrides?.materialsCare ?? DEFAULT_MATERIALS_CARE,
    shippingReturns: overrides?.shippingReturns ?? DEFAULT_SHIPPING_RETURNS,
    colors: overrides?.colors ?? product.colors,
    sizes: overrides?.sizes ?? product.sizes,
  };
}

function landingToShopProduct(
  product: (typeof newArrivals)[number],
  category: ShopProduct["category"] = "men",
): ShopProduct {
  return {
    ...product,
    category,
    sizes: ["S", "M", "L", "XL"],
    colors: ["black"],
    createdAt: "2024-06-01",
  };
}

const landingCatalog: ShopProduct[] = [
  landingToShopProduct(newArrivals[0], "men"),
  {
    ...landingToShopProduct(newArrivals[1], "men"),
    sizes: ["S", "M", "L"],
    colors: ["white"],
  },
  {
    ...landingToShopProduct(newArrivals[2], "men"),
    sizes: ["XS", "S", "M", "L"],
    colors: ["black", "white"],
  },
  {
    ...landingToShopProduct(newArrivals[3], "men"),
    sizes: ["S", "M", "L"],
    colors: ["black", "gray"],
  },
];

const catalog = new Map<string, ProductDetail>();

for (const product of shopProducts) {
  const detail = toProductDetail(product);
  catalog.set(detail.slug, detail);
}

for (const product of landingCatalog) {
  const slug = slugFromHref(product.href);
  if (!catalog.has(slug)) {
    catalog.set(slug, toProductDetail(product));
  }
}

export function getProductBySlug(slug: string): ProductDetail | undefined {
  return catalog.get(slug);
}

export function getAllProductSlugs(): string[] {
  return Array.from(catalog.keys());
}
