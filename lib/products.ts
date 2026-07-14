import { slugifyCategoryName } from "@/lib/category-tree";
import type { StoreCategory } from "@/lib/category-types";
import { getAllCategories } from "@/lib/categories";
import type {
  ProductColorOption,
  StoreProduct,
  StoreProductColor,
  StoreProductImage,
  StoreProductSize,
  StoreProductWithRelations,
} from "@/lib/product-types";
import { createClient } from "@/lib/supabase/server";
import type { ProductDetail, ProductImage, ShopProduct } from "@/lib/types";
import { computeFinalPrice } from "@/lib/pricing";

const DEFAULT_DESCRIPTION =
  "Precision-crafted for everyday wear. Designed with uncompromising attention to fit, fabric, and finish.";

const DEFAULT_MATERIALS_CARE =
  "100% premium cotton. Machine wash cold with like colors. Tumble dry low. Do not bleach. Iron on low heat if needed.";

const DEFAULT_SHIPPING_RETURNS =
  "Free standard shipping on orders over Rs. 150. Express delivery available at checkout. Returns accepted within 30 days in original condition.";

type ProductRow = StoreProduct & {
  categories:
    | {
        id: string;
        name: string;
        slug: string;
        parent_id: string | null;
      }
    | Array<{
        id: string;
        name: string;
        slug: string;
        parent_id: string | null;
      }>
    | null;
  product_images: StoreProductImage[];
  product_colors: StoreProductColor[];
  product_sizes: StoreProductSize[];
};

function normalizeCategory(
  categories: ProductRow["categories"],
): StoreProductWithRelations["category"] {
  if (!categories) return undefined;
  if (Array.isArray(categories)) {
    return categories[0] ?? undefined;
  }
  return categories;
}

function mapProductRow(row: ProductRow): StoreProductWithRelations {
  const sizes = [...row.product_sizes].sort((a, b) => a.sort_order - b.sort_order);

  return {
    id: row.id,
    category_id: row.category_id,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    price: Number(row.price),
    base_price: Number(row.base_price ?? row.price),
    discount_type:
      row.discount_type === "percentage" || row.discount_type === "fixed"
        ? row.discount_type
        : null,
    discount_value: Number(row.discount_value ?? 0),
    description: row.description,
    materials_care: row.materials_care,
    shipping_returns: row.shipping_returns,
    badge: row.badge,
    inventory: Number(row.inventory ?? 0),
    is_published: row.is_published,
    created_at: row.created_at,
    updated_at: row.updated_at,
    images: [...row.product_images].sort((a, b) => a.sort_order - b.sort_order),
    colors: [...row.product_colors].sort((a, b) => a.sort_order - b.sort_order),
    sizes,
    category: normalizeCategory(row.categories),
  };
}

function getCategorySlugPath(
  category: StoreProductWithRelations["category"],
  allCategories: StoreCategory[],
): string[] {
  if (!category) {
    return ["shop"];
  }

  const slugs: string[] = [category.slug];
  let parentId = category.parent_id;

  while (parentId) {
    const parent = allCategories.find((item) => item.id === parentId);
    if (!parent) {
      break;
    }
    slugs.unshift(parent.slug);
    parentId = parent.parent_id;
  }

  return slugs;
}

function toColorOptions(colors: StoreProductColor[]): ProductColorOption[] {
  return colors.map((color) => ({
    id: color.id,
    name: color.name,
    hex: color.hex,
  }));
}

export function toShopProduct(
  product: StoreProductWithRelations,
  allCategories: StoreCategory[] = [],
): ShopProduct {
  const primaryImage = product.images[0]?.url ?? "";
  const colorOptions = toColorOptions(product.colors);
  const categorySlugs = getCategorySlugPath(product.category, allCategories);

  const basePrice = Number(product.base_price ?? product.price);
  const discountType = product.discount_type;
  const discountValue = Number(product.discount_value ?? 0);
  const computedPricing = computeFinalPrice(basePrice, discountType, discountValue);

  return {
    id: product.id,
    brand: product.brand,
    name: product.name,
    price: computedPricing.finalPrice,
    basePrice,
    discountType,
    discountValue,
    discountAmount: computedPricing.discountAmount,
    inventory: Number(product.inventory ?? 0),
    image: primaryImage,
    href: `/products/${product.slug}`,
    badge: product.badge ?? undefined,
    category: product.category?.slug ?? "shop",
    categorySlugs,
    categoryId: product.category_id,
    sizes: product.sizes.map((size) => size.label),
    colors: colorOptions.map((color) => color.id),
    colorOptions,
    createdAt: product.created_at,
  };
}

export function toProductDetail(
  product: StoreProductWithRelations,
  allCategories: StoreCategory[] = [],
): ProductDetail {
  const shopProduct = toShopProduct(product, allCategories);
  const images: ProductImage[] =
    product.images.length > 0
      ? product.images.map((image) => ({
          src: image.url,
          alt: image.alt || product.name,
          colorName: image.color_name?.trim() || undefined,
        }))
      : [{ src: shopProduct.image, alt: product.name }];

  return {
    ...shopProduct,
    slug: product.slug,
    description: product.description || DEFAULT_DESCRIPTION,
    images,
    materialsCare: product.materials_care || DEFAULT_MATERIALS_CARE,
    shippingReturns: product.shipping_returns || DEFAULT_SHIPPING_RETURNS,
  };
}

const PRODUCT_SELECT = `
  id,
  category_id,
  name,
  slug,
  brand,
  price,
  base_price,
  discount_type,
  discount_value,
  description,
  materials_care,
  shipping_returns,
  badge,
  inventory,
  is_published,
  created_at,
  updated_at,
  categories ( id, name, slug, parent_id ),
  product_images ( id, product_id, url, alt, color_name, sort_order ),
  product_colors ( id, product_id, name, hex, sort_order ),
  product_sizes ( id, product_id, label, sort_order )
`;

export async function getPublishedProducts(): Promise<StoreProductWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as unknown as ProductRow[]).map(mapProductRow);
}

export async function getAllProductsForAdmin(): Promise<StoreProductWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as unknown as ProductRow[]).map(mapProductRow);
}

export async function getProductBySlugFromDb(
  slug: string,
): Promise<StoreProductWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapProductRow(data as unknown as ProductRow);
}

export async function getProductsByCategoryIds(
  categoryIds: string[],
): Promise<StoreProductWithRelations[]> {
  if (categoryIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_published", true)
    .in("category_id", categoryIds)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as unknown as ProductRow[]).map(mapProductRow);
}

export function slugifyProductName(name: string): string {
  return slugifyCategoryName(name);
}

export async function getPublishedShopProducts(): Promise<ShopProduct[]> {
  const [products, categories] = await Promise.all([
    getPublishedProducts(),
    getAllCategories(),
  ]);
  return products.map((product) => toShopProduct(product, categories));
}

export async function getPublishedProductDetail(
  slug: string,
): Promise<ProductDetail | null> {
  const [product, categories] = await Promise.all([
    getProductBySlugFromDb(slug),
    getAllCategories(),
  ]);
  return product ? toProductDetail(product, categories) : null;
}

export async function getPublishedProductSlugs(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("slug")
    .eq("is_published", true);

  if (error || !data) {
    return [];
  }

  return data.map((row) => row.slug as string);
}

const STANDARD_SIZE_ORDER = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
  "2XL",
  "3XL",
  "4XL",
];

export function sortSizeLabels(sizes: string[]): string[] {
  const uniqueSizes = [...new Set(sizes.map((size) => size.trim().toUpperCase()))];

  return uniqueSizes.sort((a, b) => {
    const aIndex = STANDARD_SIZE_ORDER.indexOf(a);
    const bIndex = STANDARD_SIZE_ORDER.indexOf(b);

    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    if (aIndex !== -1) {
      return -1;
    }
    if (bIndex !== -1) {
      return 1;
    }

    return a.localeCompare(b, undefined, { numeric: true });
  });
}

export async function getAllPublishedShopSizes(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_sizes")
    .select("label, products!inner(is_published)")
    .eq("products.is_published", true);

  if (error || !data) {
    return [];
  }

  return sortSizeLabels(data.map((row) => String(row.label)));
}

export async function getAllPublishedShopColors(): Promise<
  Array<{ id: string; label: string; hex: string }>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_colors")
    .select("name, hex, products!inner(is_published)")
    .eq("products.is_published", true);

  if (error || !data) {
    return [];
  }

  const colorMap = new Map<string, { id: string; label: string; hex: string }>();

  for (const row of data) {
    const label = String(row.name).trim();
    const hex = String(row.hex).trim();
    const key = label.toLowerCase();

    if (!label || colorMap.has(key)) {
      continue;
    }

    colorMap.set(key, { id: key, label, hex });
  }

  return Array.from(colorMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

export async function getCatalogMaxPrice(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("price")
    .eq("is_published", true);

  if (error || !data || data.length === 0) {
    return 0;
  }

  return data.reduce(
    (currentMax, row) => Math.max(currentMax, Number(row.price)),
    0,
  );
}

type ShopFilterDataOptions = {
  scope?: "products" | "catalog";
};

export async function getShopFilterData(
  products: ShopProduct[],
  options: ShopFilterDataOptions = {},
) {
  if (options.scope === "catalog") {
    const [sizes, colors, maxPrice] = await Promise.all([
      getAllPublishedShopSizes(),
      getAllPublishedShopColors(),
      getCatalogMaxPrice(),
    ]);

    return {
      sizes,
      colors,
      maxPrice,
    };
  }

  const sizes = sortSizeLabels(products.flatMap((product) => product.sizes));
  const colorMap = new Map<string, { id: string; label: string; hex: string }>();

  for (const product of products) {
    for (const color of product.colorOptions ?? []) {
      colorMap.set(color.id, {
        id: color.id,
        label: color.name,
        hex: color.hex,
      });
    }
  }

  const maxPrice = products.reduce(
    (currentMax, product) => Math.max(currentMax, product.price),
    0,
  );

  return {
    sizes,
    colors: Array.from(colorMap.values()),
    maxPrice,
  };
}
