"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "@/data/landing";
import { cn } from "@/lib/utils";

type HeaderNavProps = {
  isTransparent?: boolean;
};

export function HeaderNav({ isTransparent = false }: HeaderNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="absolute left-1/2 hidden -translate-x-1/2 lg:block"
      aria-label="Main navigation"
    >
      <ul className="flex items-center gap-6 xl:gap-8">
        {navLinks.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname === link.href ||
                pathname.startsWith(`${link.href}/`);

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "font-label text-xs font-bold uppercase tracking-[0.15em] leading-none hover:opacity-70",
                  isTransparent ? "text-on-primary" : "text-on-surface",
                  isActive &&
                    "underline decoration-1 underline-offset-8",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
