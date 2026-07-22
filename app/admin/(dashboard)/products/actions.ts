"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getAllCategories } from "@/lib/categories";
import { applyProductsSchemaMigration } from "@/lib/apply-products-schema-migration";
import { getProductsSchemaStatus } from "@/lib/products-schema";
import {
  getAllProductsForAdmin,
  slugifyProductName,
} from "@/lib/products";
import { computeFinalPrice } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import type { StoreCategory } from "@/lib/category-types";
import type { DiscountType } from "@/lib/types";

export type ProductActionState = {
  error?: string;
  success?: string;
};

export async function repairProductsSchema(
  _prevState: ProductActionState | null,
): Promise<ProductActionState> {
  await requireAdmin();

  try {
    await applyProductsSchemaMigration();
    const status = await getProductsSchemaStatus();

    if (!status.ready) {
      return {
        error: `Migration ran, but these items are still missing: ${status.issues.join(", ")}`,
      };
    }

    revalidatePath("/admin/products");
    return { success: "Database schema updated. You can create products now." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to update the products database schema.",
    };
  }
}

type ImageInput = { url: string; alt?: string; colorName?: string };
type ColorInput = { name: string; hex: string };
type SizeInput = { label: string };

type ProductWriteInput = {
  name: string;
  slug: string;
  brand: string;
  categoryId: string;
  categories: StoreCategory[];
  basePrice: number;
  discountType: DiscountType | null;
  discountValue: number;
  price: number;
  description: string;
  materialsCare: string;
  shippingReturns: string;
  badge: string | null;
  inventory: number;
  isPublished: boolean;
  primaryImageUrl: string;
};

function getRootCategory(
  categoryId: string,
  categories: StoreCategory[],
): StoreCategory | null {
  let current = categories.find((category) => category.id === categoryId);
  if (!current) {
    return null;
  }

  while (current.parent_id) {
    const parent = categories.find((category) => category.id === current!.parent_id);
    if (!parent) {
      break;
    }
    current = parent;
  }

  return current;
}

function toLegacyCategoryValue(
  categoryId: string,
  categories: StoreCategory[],
): string {
  const root = getRootCategory(categoryId, categories);
  if (!root) {
    return "men";
  }

  const slug = root.slug.toLowerCase();
  const legacyMap: Record<string, string> = {
    mens: "men",
    men: "men",
    womens: "women",
    women: "women",
    "baby-and-kids": "kids",
    kids: "kids",
  };

  return legacyMap[slug] ?? "men";
}

function buildProductWritePayload(input: ProductWriteInput) {
  return {
    name: input.name,
    slug: input.slug,
    brand: input.brand,
    category_id: input.categoryId,
    category: toLegacyCategoryValue(input.categoryId, input.categories),
    price: input.price,
    base_price: input.basePrice,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    description: input.description,
    materials_care: input.materialsCare,
    shipping_returns: input.shippingReturns,
    badge: input.badge,
    inventory: input.inventory,
    is_published: input.isPublished,
    is_active: input.isPublished,
    image: input.primaryImageUrl,
  };
}

function parseImages(value: FormDataEntryValue | null): ImageInput[] {
  try {
    const parsed = JSON.parse(String(value ?? "[]")) as ImageInput[];
    return Array.isArray(parsed)
      ? parsed
          .filter((image) => typeof image?.url === "string" && image.url.trim())
          .map((image) => ({
            url: image.url,
            alt: typeof image.alt === "string" ? image.alt : "",
            colorName:
              typeof image.colorName === "string" && image.colorName.trim()
                ? image.colorName.trim()
                : undefined,
          }))
      : [];
  } catch {
    return [];
  }
}

function parseColors(value: FormDataEntryValue | null): ColorInput[] {
  try {
    const parsed = JSON.parse(String(value ?? "[]")) as ColorInput[];
    return Array.isArray(parsed)
      ? parsed.filter(
          (color) =>
            typeof color?.name === "string" &&
            color.name.trim() &&
            typeof color?.hex === "string" &&
            color.hex.trim(),
        )
      : [];
  } catch {
    return [];
  }
}

function parseSizes(value: FormDataEntryValue | null): SizeInput[] {
  try {
    const parsed = JSON.parse(String(value ?? "[]")) as SizeInput[];
    return Array.isArray(parsed)
      ? parsed.filter(
          (size) => typeof size?.label === "string" && size.label.trim(),
        )
      : [];
  } catch {
    return [];
  }
}

async function revalidateProductPaths(slug?: string) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin/products");
  if (slug) {
    revalidatePath(`/products/${slug}`);
  }
}

async function replaceProductRelations(
  productId: string,
  images: ImageInput[],
  colors: ColorInput[],
  sizes: SizeInput[],
) {
  const supabase = await createClient();

  await supabase.from("product_images").delete().eq("product_id", productId);
  await supabase.from("product_colors").delete().eq("product_id", productId);
  await supabase.from("product_sizes").delete().eq("product_id", productId);

  if (images.length > 0) {
    await supabase.from("product_images").insert(
      images.map((image, index) => ({
        product_id: productId,
        url: image.url.trim(),
        alt: image.alt?.trim() ?? "",
        color_name: image.colorName?.trim() || null,
        sort_order: index,
      })),
    );
  }

  if (colors.length > 0) {
    await supabase.from("product_colors").insert(
      colors.map((color, index) => ({
        product_id: productId,
        name: color.name.trim(),
        hex: color.hex.trim(),
        sort_order: index,
      })),
    );
  }

  if (sizes.length > 0) {
    await supabase.from("product_sizes").insert(
      sizes.map((size, index) => ({
        product_id: productId,
        label: size.label.trim().toUpperCase(),
        sort_order: index,
      })),
    );
  }
}

export async function createProduct(
  _prevState: ProductActionState | null,
  formData: FormData,
): Promise<ProductActionState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const brand = String(formData.get("brand") ?? "VELVORZ").trim() || "VELVORZ";
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const basePrice = Number(formData.get("base_price"));
  const discountTypeValue = String(formData.get("discount_type") ?? "none");
  const discountValue = Number(formData.get("discount_value") ?? 0);
  const description = String(formData.get("description") ?? "").trim();
  const materialsCare = String(formData.get("materials_care") ?? "").trim();
  const shippingReturns = String(formData.get("shipping_returns") ?? "").trim();
  const badge = String(formData.get("badge") ?? "").trim() || null;
  const inventory = Number(formData.get("inventory") ?? 0);
  const isPublished = formData.get("is_published") === "on";
  const images = parseImages(formData.get("images_json"));
  const colors = parseColors(formData.get("colors_json"));
  const sizes = parseSizes(formData.get("sizes_json"));

  if (!name) return { error: "Product name is required." };
  if (!categoryId) return { error: "Category is required." };
  if (!Number.isFinite(basePrice) || basePrice < 0) {
    return { error: "Please enter a valid base price." };
  }

  const discountType: DiscountType | null =
    discountTypeValue === "percentage" || discountTypeValue === "fixed"
      ? discountTypeValue
      : null;

  if (!Number.isFinite(discountValue) || discountValue < 0) {
    return { error: "Please enter a valid discount value." };
  }

  if (discountType === "percentage" && discountValue > 100) {
    return { error: "Percentage discount cannot be greater than 100." };
  }
  if (!Number.isFinite(inventory) || inventory < 0) {
    return { error: "Please enter a valid inventory quantity." };
  }
  if (images.length === 0) {
    return { error: "At least one product image is required." };
  }
  if (colors.length === 0) {
    return { error: "At least one color is required." };
  }
  if (sizes.length === 0) {
    return { error: "Add at least one size." };
  }

  const pricing = computeFinalPrice(basePrice, discountType, discountValue);

  const slug = slugifyProductName(name);
  if (!slug) return { error: "Please enter a valid product name." };

  const categories = await getAllCategories();
  const selectedCategory = categories.find((category) => category.id === categoryId);
  if (!selectedCategory) {
    return { error: "Selected category does not exist." };
  }

  const existing = await getAllProductsForAdmin();
  if (existing.some((product) => product.slug === slug)) {
    return { error: "A product with this name already exists." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert(
      buildProductWritePayload({
        name,
        slug,
        brand,
        categoryId,
        categories,
        basePrice,
        discountType,
        discountValue,
        price: pricing.finalPrice,
        description,
        materialsCare,
        shippingReturns,
        badge,
        inventory: Math.floor(inventory),
        isPublished,
        primaryImageUrl: images[0]!.url.trim(),
      }),
    )
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message || "Unable to create product." };
  }

  await replaceProductRelations(data.id, images, colors, sizes);
  await revalidateProductPaths(slug);

  return { success: "Product created successfully." };
}

export async function updateProduct(
  _prevState: ProductActionState | null,
  formData: FormData,
): Promise<ProductActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const brand = String(formData.get("brand") ?? "VELVORZ").trim() || "VELVORZ";
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const basePrice = Number(formData.get("base_price"));
  const discountTypeValue = String(formData.get("discount_type") ?? "none");
  const discountValue = Number(formData.get("discount_value") ?? 0);
  const description = String(formData.get("description") ?? "").trim();
  const materialsCare = String(formData.get("materials_care") ?? "").trim();
  const shippingReturns = String(formData.get("shipping_returns") ?? "").trim();
  const badge = String(formData.get("badge") ?? "").trim() || null;
  const inventory = Number(formData.get("inventory") ?? 0);
  const isPublished = formData.get("is_published") === "on";
  const images = parseImages(formData.get("images_json"));
  const colors = parseColors(formData.get("colors_json"));
  const sizes = parseSizes(formData.get("sizes_json"));

  if (!id) return { error: "Product id is required." };
  if (!name) return { error: "Product name is required." };
  if (!categoryId) return { error: "Category is required." };
  if (!Number.isFinite(basePrice) || basePrice < 0) {
    return { error: "Please enter a valid base price." };
  }

  const discountType: DiscountType | null =
    discountTypeValue === "percentage" || discountTypeValue === "fixed"
      ? discountTypeValue
      : null;

  if (!Number.isFinite(discountValue) || discountValue < 0) {
    return { error: "Please enter a valid discount value." };
  }

  if (discountType === "percentage" && discountValue > 100) {
    return { error: "Percentage discount cannot be greater than 100." };
  }
  if (!Number.isFinite(inventory) || inventory < 0) {
    return { error: "Please enter a valid inventory quantity." };
  }
  if (images.length === 0) {
    return { error: "At least one product image is required." };
  }
  if (colors.length === 0) {
    return { error: "At least one color is required." };
  }
  if (sizes.length === 0) {
    return { error: "Add at least one size." };
  }

  const pricing = computeFinalPrice(basePrice, discountType, discountValue);

  const existingProducts = await getAllProductsForAdmin();
  const existing = existingProducts.find((product) => product.id === id);
  if (!existing) return { error: "Product not found." };

  const slug = slugifyProductName(name);
  if (!slug) return { error: "Please enter a valid product name." };

  const categories = await getAllCategories();
  const selectedCategory = categories.find((category) => category.id === categoryId);
  if (!selectedCategory) {
    return { error: "Selected category does not exist." };
  }

  if (
    existingProducts.some(
      (product) => product.slug === slug && product.id !== id,
    )
  ) {
    return { error: "A product with this name already exists." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update(
      buildProductWritePayload({
        name,
        slug,
        brand,
        categoryId,
        categories,
        basePrice,
        discountType,
        discountValue,
        price: pricing.finalPrice,
        description,
        materialsCare,
        shippingReturns,
        badge,
        inventory: Math.floor(inventory),
        isPublished,
        primaryImageUrl: images[0]!.url.trim(),
      }),
    )
    .eq("id", id);

  if (error) {
    return { error: error.message || "Unable to update product." };
  }

  await replaceProductRelations(id, images, colors, sizes);
  await revalidateProductPaths(existing.slug);
  await revalidateProductPaths(slug);

  return { success: "Product updated successfully." };
}

export async function deleteProduct(
  _prevState: ProductActionState | null,
  formData: FormData,
): Promise<ProductActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Product id is required." };

  const existingProducts = await getAllProductsForAdmin();
  const existing = existingProducts.find((product) => product.id === id);
  if (!existing) return { error: "Product not found." };

  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    return { error: error.message || "Unable to delete product." };
  }

  await revalidateProductPaths(existing.slug);
  return { success: "Product deleted." };
}
