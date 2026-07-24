"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { hasActiveNavDescendant, isNavLinkActive } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { NavLink } from "@/lib/types";

type HeaderNavProps = {
  isTransparent?: boolean;
  navLinks: NavLink[];
};

function NavSubmenuLinks({
  links,
  pathname,
  shopCategory,
  depth = 0,
}: {
  links: NavLink[];
  pathname: string;
  shopCategory: string | null;
  depth?: number;
}) {
  if (links.length === 0) {
    return null;
  }

  if (depth === 0) {
    return (
      <ul className="flex max-w-xs flex-col gap-4">
        {links.map((link) => (
          <li key={link.href} className="min-w-0">
            <Link
              href={link.href}
              role="menuitem"
              className={cn(
                "font-label block text-xs font-bold uppercase tracking-[0.14em] leading-none text-on-surface transition-opacity hover:opacity-60",
                hasActiveNavDescendant(pathname, link, shopCategory) &&
                  "underline decoration-1 underline-offset-4",
              )}
            >
              {link.label}
            </Link>
            <NavSubmenuLinks
              links={link.children ?? []}
              pathname={pathname}
              shopCategory={shopCategory}
              depth={depth + 1}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="mt-3 space-y-2.5 border-l border-outline-variant pl-3">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            role="menuitem"
            className={cn(
              depth === 1
                ? "font-body block text-sm leading-none text-on-surface-variant transition-colors hover:text-on-surface"
                : "font-body block text-xs leading-none text-on-surface-variant transition-colors hover:text-on-surface",
              isNavLinkActive(pathname, link.href, shopCategory) && "text-on-surface",
            )}
          >
            {link.label}
          </Link>
          <NavSubmenuLinks
            links={link.children ?? []}
            pathname={pathname}
            shopCategory={shopCategory}
            depth={depth + 1}
          />
        </li>
      ))}
    </ul>
  );
}

function NavItem({
  link,
  isTransparent,
  openHref,
  onOpen,
  onClose,
  shopCategory,
}: {
  link: NavLink;
  isTransparent: boolean;
  openHref: string | null;
  onOpen: (href: string) => void;
  onClose: () => void;
  shopCategory: string | null;
}) {
  const pathname = usePathname();
  const menuId = useId();
  const children = link.children ?? [];
  const isActive = hasActiveNavDescendant(pathname, link, shopCategory);
  const isOpen = openHref === link.href && children.length > 0;
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    if (children.length > 0) {
      onOpen(link.href);
    } else {
      onClose();
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => onClose(), 140);
  };

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  return (
    <li
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onFocus={openMenu}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          scheduleClose();
        }
      }}
    >
      <Link
        href={link.href}
        aria-expanded={children.length > 0 ? isOpen : undefined}
        aria-haspopup={children.length > 0 ? "true" : undefined}
        aria-controls={children.length > 0 ? menuId : undefined}
        className={cn(
          "font-label relative inline-flex items-center pb-1 text-xs font-bold uppercase tracking-[0.15em] leading-none transition-opacity hover:opacity-70",
          isTransparent ? "text-on-primary" : "text-on-surface",
          (isActive || isOpen) && "opacity-100",
        )}
      >
        {link.label}
        <span
          className={cn(
            "absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-current transition-transform duration-300",
            (isActive || isOpen) && "scale-x-100",
          )}
          aria-hidden="true"
        />
      </Link>

      {children.length > 0 ? (
        <div
          id={menuId}
          role="menu"
          aria-label={`${link.label} categories`}
          aria-hidden={!isOpen}
          className={cn(
            "fixed inset-x-0 top-16 z-80 border-b border-outline-variant bg-surface-container-lowest md:top-20",
            "transition-[opacity,transform] duration-250 ease-out",
            isOpen
              ? "visible translate-y-0 opacity-100"
              : "invisible pointer-events-none -translate-y-1 opacity-0",
          )}
        >
          <div className="mx-auto grid max-w-[100rem] gap-10 px-6 py-10 md:grid-cols-[minmax(0,220px)_1fr] md:px-16 lg:gap-16 lg:py-12">
            <div className="flex flex-col justify-between gap-8 border-b border-outline-variant pb-8 md:border-b-0 md:border-r md:pb-0 md:pr-10">
              <div>
                <p className="font-label text-[10px] font-bold uppercase tracking-[0.2em] leading-none text-on-surface-variant">
                  Category
                </p>
                <h2 className="font-headline mt-3 text-2xl font-extrabold uppercase tracking-tight text-on-surface lg:text-3xl">
                  {link.label}
                </h2>
                <p className="font-body mt-3 max-w-[16rem] text-sm leading-relaxed text-on-surface-variant">
                  Explore curated edits and essentials in {link.label.toLowerCase()}.
                </p>
              </div>
              <Link
                href={link.href}
                role="menuitem"
                className="font-label inline-flex w-fit items-center gap-2 border-b border-on-surface pb-1 text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface transition-opacity hover:opacity-70"
              >
                Shop all {link.label}
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div>
              <p className="font-label mb-5 text-[10px] font-bold uppercase tracking-[0.2em] leading-none text-on-surface-variant">
                Browse
              </p>
              <NavSubmenuLinks
                links={children}
                pathname={pathname}
                shopCategory={shopCategory}
              />
            </div>
          </div>
        </div>
      ) : null}
    </li>
  );
}

export function HeaderNav({ isTransparent = false, navLinks }: HeaderNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shopCategory = searchParams.get("category");
  const [openHref, setOpenHref] = useState<string | null>(null);

  useEffect(() => {
    setOpenHref(null);
  }, [pathname]);

  return (
    <nav
      className="absolute left-1/2 hidden -translate-x-1/2 lg:block"
      aria-label="Main navigation"
    >
      <ul className="flex items-center gap-6 xl:gap-8">
        {navLinks.map((link) => (
          <NavItem
            key={link.href}
            link={link}
            isTransparent={isTransparent}
            openHref={openHref}
            onOpen={setOpenHref}
            onClose={() => setOpenHref(null)}
            shopCategory={shopCategory}
          />
        ))}
      </ul>
    </nav>
  );
}
