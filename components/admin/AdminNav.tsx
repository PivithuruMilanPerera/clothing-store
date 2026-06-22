"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Banner & Logo", href: "/admin/banner-logo" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin navigation"
      className="mt-6 flex flex-wrap gap-2 border-b border-outline-variant pb-4"
    >
      {adminNavItems.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "font-label text-xs font-bold uppercase tracking-[0.15em] leading-none border px-4 py-2 transition-none",
              isActive
                ? "border-primary bg-primary text-on-primary"
                : "border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
