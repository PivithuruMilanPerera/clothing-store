"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  countMainCategories,
  findCategoryDescendantIds,
  getAllCategories,
  isReservedCategorySlug,
  MAX_MAIN_CATEGORIES,
  slugifyCategoryName,
} from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";

export type CategoryActionState = {
  error?: string;
  success?: string;
};

function parseOptionalParentId(value: FormDataEntryValue | null): string | null {
  const raw = String(value ?? "").trim();
  return raw.length > 0 ? raw : null;
}

function parseOptionalImageUrl(value: FormDataEntryValue | null): string | null {
  const raw = String(value ?? "").trim();
  return raw.length > 0 ? raw : null;
}

function mapDbError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("maximum of 8 main categories")) {
    return `Only ${MAX_MAIN_CATEGORIES} main categories are allowed.`;
  }
  if (lower.includes("categories_slug") || lower.includes("duplicate")) {
    return "A category with that name already exists.";
  }
  return message || "Unable to save category. Please try again.";
}

async function revalidateCategoryPaths(...slugs: Array<string | undefined>) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin/categories");
  for (const slug of slugs) {
    if (slug) {
      revalidatePath(`/${slug}`);
    }
  }
}

export async function createCategory(
  _prevState: CategoryActionState | null,
  formData: FormData,
): Promise<CategoryActionState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const parentId = parseOptionalParentId(formData.get("parent_id"));
  const imageUrl = parseOptionalImageUrl(formData.get("image_url"));

  if (!name) {
    return { error: "Category name is required." };
  }

  const slug = slugifyCategoryName(name);
  if (!slug) {
    return { error: "Please enter a valid category name." };
  }

  if (isReservedCategorySlug(slug)) {
    return {
      error: "That category name is reserved by the site. Choose another.",
    };
  }

  const categories = await getAllCategories();

  if (categories.some((category) => category.slug === slug)) {
    return { error: "A category with this name already exists." };
  }

  if (!parentId) {
    if (countMainCategories(categories) >= MAX_MAIN_CATEGORIES) {
      return {
        error: `Only ${MAX_MAIN_CATEGORIES} main categories are allowed.`,
      };
    }
  } else if (!categories.some((category) => category.id === parentId)) {
    return { error: "Selected parent category does not exist." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({
    name,
    slug,
    parent_id: parentId,
    image_url: imageUrl,
  });

  if (error) {
    return { error: mapDbError(error.message) };
  }

  await revalidateCategoryPaths(slug);

  return {
    success: parentId
      ? "Sub-category created successfully."
      : "Main category created and added to site navigation.",
  };
}

export async function updateCategory(
  _prevState: CategoryActionState | null,
  formData: FormData,
): Promise<CategoryActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const parentId = parseOptionalParentId(formData.get("parent_id"));
  const imageUrl = parseOptionalImageUrl(formData.get("image_url"));

  if (!id) {
    return { error: "Category id is required." };
  }

  if (!name) {
    return { error: "Category name is required." };
  }

  const categories = await getAllCategories();
  const existing = categories.find((category) => category.id === id);

  if (!existing) {
    return { error: "Category not found." };
  }

  const slug = slugifyCategoryName(name);
  if (!slug) {
    return { error: "Please enter a valid category name." };
  }

  if (isReservedCategorySlug(slug)) {
    return {
      error: "That category name is reserved by the site. Choose another.",
    };
  }

  if (
    categories.some(
      (category) => category.slug === slug && category.id !== id,
    )
  ) {
    return { error: "A category with this name already exists." };
  }

  if (parentId === id) {
    return { error: "A category cannot be its own parent." };
  }

  if (parentId) {
    if (!categories.some((category) => category.id === parentId)) {
      return { error: "Selected parent category does not exist." };
    }

    const descendants = findCategoryDescendantIds(categories, id);
    if (descendants.has(parentId)) {
      return {
        error: "A category cannot be nested under one of its children.",
      };
    }
  }

  const wasMain = existing.parent_id === null;
  const willBeMain = parentId === null;

  if (!wasMain && willBeMain) {
    if (countMainCategories(categories) >= MAX_MAIN_CATEGORIES) {
      return {
        error: `Only ${MAX_MAIN_CATEGORIES} main categories are allowed.`,
      };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({
      name,
      slug,
      parent_id: parentId,
      image_url: imageUrl,
    })
    .eq("id", id);

  if (error) {
    return { error: mapDbError(error.message) };
  }

  await revalidateCategoryPaths(existing.slug, slug);

  return { success: "Category updated successfully." };
}

export async function deleteCategory(
  _prevState: CategoryActionState | null,
  formData: FormData,
): Promise<CategoryActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return { error: "Category id is required." };
  }

  const categories = await getAllCategories();
  const existing = categories.find((category) => category.id === id);

  if (!existing) {
    return { error: "Category not found." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return { error: mapDbError(error.message) };
  }

  await revalidateCategoryPaths(existing.slug);

  return {
    success: existing.parent_id
      ? "Sub-category deleted."
      : "Main category deleted.",
  };
}
