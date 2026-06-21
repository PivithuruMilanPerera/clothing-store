"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { accountNavItems } from "@/data/account";
import { cn } from "@/lib/utils";

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account navigation" className="flex flex-col gap-1">
      {accountNavItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "border px-4 py-4 transition-colors",
              isActive
                ? "border-primary bg-primary text-on-primary"
                : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary",
            )}
          >
            <span className="type-label-uppercase block">{item.label}</span>
            <span
              className={cn(
                "type-body-md mt-1 block text-sm",
                isActive ? "text-on-primary/80" : "text-on-surface-variant",
              )}
            >
              {item.description}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
