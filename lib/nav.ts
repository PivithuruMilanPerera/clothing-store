import type { NavLink } from "@/lib/types";

export function getShopCategoryFromHref(href: string): string | null {
  if (!href.startsWith("/shop")) {
    return null;
  }

  const queryIndex = href.indexOf("?");
  if (queryIndex === -1) {
    return null;
  }

  const params = new URLSearchParams(href.slice(queryIndex + 1));
  return params.get("category");
}

export function isNavLinkActive(
  pathname: string,
  href: string,
  shopCategory: string | null,
): boolean {
  const categoryFromHref = getShopCategoryFromHref(href);

  if (categoryFromHref) {
    return pathname === "/shop" && shopCategory === categoryFromHref;
  }

  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function hasActiveNavDescendant(
  pathname: string,
  link: NavLink,
  shopCategory: string | null,
): boolean {
  if (isNavLinkActive(pathname, link.href, shopCategory)) {
    return true;
  }

  return (
    link.children?.some((child) =>
      hasActiveNavDescendant(pathname, child, shopCategory),
    ) ?? false
  );
}
