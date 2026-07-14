import type { CategoryTreeNode, StoreCategory } from "@/lib/category-types";

export type ShopCategoryFilterNode = {
  id: string;
  label: string;
  children: ShopCategoryFilterNode[];
};

export type CategoryPickerOption = {
  id: string;
  label: string;
};

const RESERVED_CATEGORY_SLUGS = new Set([
  "about",
  "account",
  "admin",
  "api",
  "auth",
  "cart",
  "contact",
  "login",
  "products",
  "register",
  "shop",
]);

export function slugifyCategoryName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function isReservedCategorySlug(slug: string): boolean {
  return RESERVED_CATEGORY_SLUGS.has(slug);
}

export function flattenCategoryTreeOptions(
  nodes: CategoryTreeNode[],
  depth = 0,
  excludeIds: Set<string> = new Set(),
): CategoryPickerOption[] {
  return nodes.flatMap((node) => {
    if (excludeIds.has(node.id)) {
      return [];
    }

    const prefix = depth > 0 ? `${"— ".repeat(depth)}` : "";
    return [
      { id: node.id, label: `${prefix}${node.name}` },
      ...flattenCategoryTreeOptions(node.children, depth + 1, excludeIds),
    ];
  });
}

export function mapCategoryTreeToShopFilters(
  nodes: CategoryTreeNode[],
): ShopCategoryFilterNode[] {
  return nodes.map((node) => ({
    id: node.slug,
    label: node.name,
    children: mapCategoryTreeToShopFilters(node.children),
  }));
}

export function getShopCategoryHref(slug: string): string {
  return `/shop?category=${encodeURIComponent(slug)}`;
}

function getSubtreeSlugs(node: ShopCategoryFilterNode): string[] {
  return [node.id, ...node.children.flatMap(getSubtreeSlugs)];
}

export function getCategoryFilterSlugs(
  slug: string,
  categories: ShopCategoryFilterNode[],
): string[] {
  function findNode(
    nodes: ShopCategoryFilterNode[],
  ): ShopCategoryFilterNode | null {
    for (const node of nodes) {
      if (node.id === slug) {
        return node;
      }

      const match = findNode(node.children);
      if (match) {
        return match;
      }
    }

    return null;
  }

  const node = findNode(categories);
  if (!node) {
    return [slug];
  }

  if (node.children.length === 0) {
    return [node.id];
  }

  return getSubtreeSlugs(node);
}

export function getCategoryToggleSlugs(node: ShopCategoryFilterNode): string[] {
  if (node.children.length === 0) {
    return [node.id];
  }

  return getSubtreeSlugs(node);
}

export function findCategoryDescendantIds(
  categories: StoreCategory[],
  categoryId: string,
): Set<string> {
  const childrenByParent = new Map<string, string[]>();

  for (const category of categories) {
    if (!category.parent_id) continue;
    const siblings = childrenByParent.get(category.parent_id) ?? [];
    siblings.push(category.id);
    childrenByParent.set(category.parent_id, siblings);
  }

  const descendants = new Set<string>();
  const stack = [...(childrenByParent.get(categoryId) ?? [])];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId || descendants.has(currentId)) continue;
    descendants.add(currentId);
    stack.push(...(childrenByParent.get(currentId) ?? []));
  }

  return descendants;
}

export function countMainCategories(categories: StoreCategory[]): number {
  return categories.filter((category) => category.parent_id === null).length;
}
