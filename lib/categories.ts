import {
  MAX_MAIN_CATEGORIES,
  type CategoryTreeNode,
  type StoreCategory,
} from "@/lib/category-types";
import {
  countMainCategories,
  findCategoryDescendantIds,
  getShopCategoryHref,
  isReservedCategorySlug,
  slugifyCategoryName,
} from "@/lib/category-tree";
import { createClient } from "@/lib/supabase/server";
import type { NavLink } from "@/lib/types";

export { MAX_MAIN_CATEGORIES, type CategoryTreeNode, type StoreCategory };
export {
  countMainCategories,
  findCategoryDescendantIds,
  isReservedCategorySlug,
  slugifyCategoryName,
} from "@/lib/category-tree";

export function getDefaultMainCategoryLinks(): NavLink[] {
  return [];
}

function toNavLink(node: CategoryTreeNode): NavLink {
  return {
    label: node.name,
    href: getShopCategoryHref(node.slug),
    ...(node.children.length > 0
      ? { children: node.children.map(toNavLink) }
      : {}),
  };
}

export async function getAllCategories(): Promise<StoreCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, image_url, created_at, updated_at")
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as StoreCategory[];
}

export async function getCategoryBySlug(
  slug: string,
): Promise<StoreCategory | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, image_url, created_at, updated_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return null;
  }

  return (data as StoreCategory | null) ?? null;
}

export async function getMainCategoryLinks(): Promise<NavLink[]> {
  const tree = await getCategoryTree();
  return tree.map(toNavLink);
}

export async function getCategoryTree(): Promise<CategoryTreeNode[]> {
  const categories = await getAllCategories();
  const nodes = new Map<string, CategoryTreeNode>();

  for (const category of categories) {
    nodes.set(category.id, { ...category, children: [] });
  }

  const roots: CategoryTreeNode[] = [];

  for (const category of categories) {
    const node = nodes.get(category.id);
    if (!node) {
      continue;
    }

    if (category.parent_id && nodes.has(category.parent_id)) {
      nodes.get(category.parent_id)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function getCategoryIdsWithDescendants(
  categoryId: string,
): Promise<string[]> {
  const categories = await getAllCategories();
  const descendants = findCategoryDescendantIds(categories, categoryId);
  return [categoryId, ...Array.from(descendants)];
}

export async function getMainCategoriesForDisplay() {
  const tree = await getCategoryTree();

  return tree.map((category) => ({
    id: category.id,
    name: category.name,
    image: category.image_url ?? "",
    href: getShopCategoryHref(category.slug),
  }));
}
