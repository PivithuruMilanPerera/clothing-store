"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, ImageIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: HomeIcon },
  { label: "Banner & Logo", href: "/admin/banner-logo", icon: ImageIcon },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto py-4 px-3">
      <ul className="space-y-0.5">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-sm px-3 py-2.5 font-label text-xs font-bold uppercase tracking-[0.12em] leading-none transition-colors",
                  isActive
                    ? "bg-on-primary/15 text-on-primary"
                    : "text-on-primary/55 hover:bg-on-primary/8 hover:text-on-primary",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
