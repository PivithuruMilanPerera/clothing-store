import { slugifyCategoryName } from "@/lib/category-tree";
import type { StoreCategory } from "@/lib/category-types";
import { getAllCategories } from "@/lib/categories";
import type {
  Brand,
  Color,
  ProductColorOption,
  ShopFilterColor,
  Size,
  StoreProduct,
  StoreProductColor,
  StoreProductImage,
  StoreProductSize,
  StoreProductVariant,
  StoreProductWithRelations,
} from "@/lib/product-types";
import { getProductStockState } from "@/lib/inventory";
import { createClient } from "@/lib/supabase/server";
import type { ProductDetail, ProductImage, ShopProduct } from "@/lib/types";
import { computeFinalPrice } from "@/lib/pricing";

const DEFAULT_DESCRIPTION =
  "Precision-crafted for everyday wear. Designed with uncompromising attention to fit, fabric, and finish.";

const DEFAULT_MATERIALS_CARE =
  "100% premium cotton. Machine wash cold with like colors. Tumble dry low. Do not bleach. Iron on low heat if needed.";

const DEFAULT_SHIPPING_RETURNS =
  "Free standard shipping on orders over Rs. 150. Express delivery available at checkout. Returns accepted within 30 days in original condition.";

type ProductColorRow = {
  id: string;
  product_id: string;
  color_id: string;
  sort_order: number;
  colors: Color | Color[] | null;
};

type ProductSizeRow = {
  id: string;
  product_id: string;
  size_id: string;
  sort_order: number;
  sizes: Size | Size[] | null;
};

type ProductImageRow = {
  id: string;
  product_id: string;
  url: string;
  alt: string;
  color_id: string | null;
  sort_order: number;
  colors: Color | Color[] | null;
};

type ProductVariantRow = {
  id: string;
  product_id: string;
  color_id: string;
  size_id: string;
  inventory: number;
  colors: Color | Color[] | null;
  sizes: Size | Size[] | null;
};

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
  product_images: ProductImageRow[];
  product_colors: ProductColorRow[];
  product_sizes: ProductSizeRow[];
  product_variants: ProductVariantRow[];
};

function normalizeRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapProductColorRow(row: ProductColorRow): StoreProductColor | null {
  const color = normalizeRelation(row.colors);
  if (!color) {
    return null;
  }

  return {
    id: row.id,
    product_id: row.product_id,
    color_id: row.color_id,
    sort_order: row.sort_order,
    color: {
      id: color.id,
      name: color.name,
      hex: color.hex,
    },
  };
}

function mapProductSizeRow(row: ProductSizeRow): StoreProductSize | null {
  const size = normalizeRelation(row.sizes);
  if (!size) {
    return null;
  }

  return {
    id: row.id,
    product_id: row.product_id,
    size_id: row.size_id,
    sort_order: row.sort_order,
    size: {
      id: size.id,
      label: size.label,
    },
  };
}

function mapProductVariantRow(row: ProductVariantRow): StoreProductVariant {
  const color = normalizeRelation(row.colors);
  const size = normalizeRelation(row.sizes);

  return {
    id: row.id,
    product_id: row.product_id,
    color_id: row.color_id,
    size_id: row.size_id,
    inventory: Number(row.inventory ?? 0),
    color: color
      ? {
          id: color.id,
          name: color.name,
          hex: color.hex,
        }
      : undefined,
    size: size
      ? {
          id: size.id,
          label: size.label,
        }
      : undefined,
  };
}

function mapProductImageRow(row: ProductImageRow): StoreProductImage {
  const color = normalizeRelation(row.colors);

  return {
    id: row.id,
    product_id: row.product_id,
    url: row.url,
    alt: row.alt,
    color_id: row.color_id,
    sort_order: row.sort_order,
    color: color
      ? {
          id: color.id,
          name: color.name,
          hex: color.hex,
        }
      : null,
  };
}

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
  const sizes = row.product_sizes
    .map(mapProductSizeRow)
    .filter((size): size is StoreProductSize => size !== null)
    .sort((a, b) => a.sort_order - b.sort_order);

  const colors = row.product_colors
    .map(mapProductColorRow)
    .filter((color): color is StoreProductColor => color !== null)
    .sort((a, b) => a.sort_order - b.sort_order);

  const variants = (row.product_variants ?? [])
    .map(mapProductVariantRow)
    .sort((a, b) => {
      const colorOrder =
        colors.findIndex((color) => color.color_id === a.color_id) -
        colors.findIndex((color) => color.color_id === b.color_id);
      if (colorOrder !== 0) {
        return colorOrder;
      }

      return (
        sizes.findIndex((size) => size.size_id === a.size_id) -
        sizes.findIndex((size) => size.size_id === b.size_id)
      );
    });

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
    images: row.product_images
      .map(mapProductImageRow)
      .sort((a, b) => a.sort_order - b.sort_order),
    colors,
    sizes,
    variants,
    category: normalizeCategory(row.categories),
  };
}

function getCategoryPath(
  category: StoreProductWithRelations["category"],
  allCategories: StoreCategory[],
): { slugs: string[]; labels: string[] } {
  if (!category) {
    return { slugs: ["shop"], labels: ["Shop"] };
  }

  const slugs: string[] = [category.slug];
  const labels: string[] = [category.name];
  let parentId = category.parent_id;

  while (parentId) {
    const parent = allCategories.find((item) => item.id === parentId);
    if (!parent) {
      break;
    }
    slugs.unshift(parent.slug);
    labels.unshift(parent.name);
    parentId = parent.parent_id;
  }

  return { slugs, labels };
}

function toColorOptions(colors: StoreProductColor[]): ProductColorOption[] {
  return colors.map((entry) => ({
    id: entry.color_id,
    name: entry.color.name,
    hex: entry.color.hex,
  }));
}

export function toShopProduct(
  product: StoreProductWithRelations,
  allCategories: StoreCategory[] = [],
): ShopProduct {
  const primaryImage = product.images[0]?.url ?? "";
  const colorOptions = toColorOptions(product.colors);
  const { slugs: categorySlugs, labels: categoryLabels } = getCategoryPath(
    product.category,
    allCategories,
  );

  const basePrice = Number(product.base_price ?? product.price);
  const discountType = product.discount_type;
  const discountValue = Number(product.discount_value ?? 0);
  const computedPricing = computeFinalPrice(basePrice, discountType, discountValue);
  const stockState = getProductStockState(product.variants ?? []);

  return {
    id: product.id,
    brand: product.brand,
    name: product.name,
    price: computedPricing.finalPrice,
    basePrice,
    discountType,
    discountValue,
    discountAmount: computedPricing.discountAmount,
    inventory: stockState.totalInventory,
    isLowStock: stockState.isLowStock,
    image: primaryImage,
    href: `/products/${product.slug}`,
    badge: product.badge ?? undefined,
    category: product.category?.slug ?? "shop",
    categorySlugs,
    categoryLabels,
    categoryId: product.category_id,
    description: product.description ?? "",
    sizes: product.sizes.map((size) => size.size.label),
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
          colorId: image.color_id ?? undefined,
        }))
      : [{ src: shopProduct.image, alt: product.name }];

  return {
    ...shopProduct,
    slug: product.slug,
    description: product.description || DEFAULT_DESCRIPTION,
    images,
    materialsCare: product.materials_care || DEFAULT_MATERIALS_CARE,
    shippingReturns: product.shipping_returns || DEFAULT_SHIPPING_RETURNS,
    variantInventory: (product.variants ?? []).map((variant) => ({
      colorId: variant.color_id,
      sizeId: variant.size_id,
      sizeLabel: variant.size?.label ?? "",
      inventory: variant.inventory,
    })),
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
  product_images ( id, product_id, url, alt, color_id, sort_order, colors ( id, name, hex ) ),
  product_colors ( id, product_id, color_id, sort_order, colors ( id, name, hex ) ),
  product_sizes ( id, product_id, size_id, sort_order, sizes ( id, label ) ),
  product_variants ( id, product_id, color_id, size_id, inventory, colors ( id, name, hex ), sizes ( id, label ) )
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

export async function getAllBrands(): Promise<Brand[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id, name")
    .order("name");

  if (!error && data) {
    return data.map((row) => ({
      id: String(row.id),
      name: String(row.name).trim(),
    }));
  }

  const { data: productRows, error: productError } = await supabase
    .from("products")
    .select("brand");

  if (productError || !productRows) {
    return [];
  }

  const brandMap = new Map<string, Brand>();
  for (const row of productRows) {
    const name = String(row.brand).trim();
    if (!name) {
      continue;
    }

    const key = name.toLowerCase();
    if (!brandMap.has(key)) {
      brandMap.set(key, { id: key, name });
    }
  }

  return Array.from(brandMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export async function getAllColors(): Promise<Color[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("colors")
    .select("id, name, hex")
    .order("name");

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: String(row.id),
    name: String(row.name).trim(),
    hex: String(row.hex).trim().toLowerCase(),
  }));
}

export async function getAllSizes(): Promise<Size[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sizes")
    .select("id, label")
    .order("label");

  if (error || !data) {
    return [];
  }

  return sortSizeLabels(data.map((row) => String(row.label))).map((label) => {
    const match = data.find((row) => String(row.label).toUpperCase() === label);
    return {
      id: String(match?.id ?? label),
      label,
    };
  });
}

export async function getAllPublishedShopSizes(): Promise<string[]> {
  const sizes = await getAllSizes();
  return sizes.map((size) => size.label);
}

export function buildShopFilterColors(products: ShopProduct[]): ShopFilterColor[] {
  const colorMap = new Map<string, ShopFilterColor>();

  for (const product of products) {
    for (const color of product.colorOptions ?? []) {
      if (!color.id || colorMap.has(color.id)) {
        continue;
      }

      colorMap.set(color.id, {
        id: color.id,
        label: color.name.trim(),
        hex: color.hex,
      });
    }
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

function getUniqueBrands(products: ShopProduct[]): string[] {
  return Array.from(
    new Set(
      products
        .map((product) => product.brand.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

export async function getShopFilterData(
  products: ShopProduct[],
  options: ShopFilterDataOptions = {},
) {
  const brands = getUniqueBrands(products);
  const colors = buildShopFilterColors(products);

  if (options.scope === "catalog") {
    const [sizes, maxPrice] = await Promise.all([
      getAllPublishedShopSizes(),
      getCatalogMaxPrice(),
    ]);

    return {
      brands,
      sizes,
      colors,
      maxPrice,
    };
  }

  const sizes = sortSizeLabels(products.flatMap((product) => product.sizes));
  const maxPrice = products.reduce(
    (currentMax, product) => Math.max(currentMax, product.price),
    0,
  );

  return {
    brands,
    sizes,
    colors,
    maxPrice,
  };
}
