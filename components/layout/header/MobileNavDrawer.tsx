"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MenuIcon, XIcon } from "@/components/icons";
import { navLinks } from "@/data/landing";
import { cn } from "@/lib/utils";

type MobileNavDrawerProps = {
  isTransparent?: boolean;
};

export function MobileNavDrawer({
  isTransparent = false,
}: MobileNavDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-drawer"
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "hover:opacity-70 lg:hidden",
          isTransparent ? "text-on-primary" : "text-primary",
        )}
      >
        {isOpen ? (
          <XIcon className="h-5 w-5" />
        ) : (
          <MenuIcon className="h-5 w-5" />
        )}
      </button>

      <div
        className={cn(
          "fixed inset-0 z-60 bg-black/40 transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden={!isOpen}
      />

      <aside
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        aria-hidden={!isOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-70 flex w-72 max-w-[85vw] flex-col border-r border-outline-variant bg-surface-container-lowest transition-transform duration-300 ease-out lg:hidden",
          isOpen ? "translate-x-0" : "pointer-events-none -translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-outline-variant px-5">
          <span className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface">Menu</span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setIsOpen(false)}
            className="text-primary hover:opacity-70"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 py-6" aria-label="Main navigation">
          <ul className="flex flex-col gap-6">
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
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface hover:opacity-70",
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
      </aside>
    </>
  );
}
