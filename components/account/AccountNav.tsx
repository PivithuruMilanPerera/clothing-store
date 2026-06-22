"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MenuIcon, XIcon } from "@/components/icons";
import { accountNavItems } from "@/data/account";
import { cn } from "@/lib/utils";

function useAccountNavState() {
  const pathname = usePathname();

  const activeItem = accountNavItems.find(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return { pathname, activeItem };
}

function AccountNavLink({
  href,
  label,
  isActive,
  onNavigate,
  className,
}: {
  href: string;
  label: string;
  isActive: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "border px-4 py-4 transition-colors",
        isActive
          ? "border-primary bg-primary text-on-primary"
          : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary",
        className,
      )}
    >
      <span className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none block">
        {label}
      </span>
    </Link>
  );
}

export function AccountNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname, activeItem } = useAccountNavState();

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
        aria-label={isOpen ? "Close account menu" : "Open account menu"}
        aria-expanded={isOpen}
        aria-controls="account-nav-drawer"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between border border-outline-variant bg-surface-container-lowest px-4 py-4 text-on-surface transition-colors hover:border-primary lg:hidden"
      >
        <span className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none">
          {activeItem?.label ?? "Account Menu"}
        </span>
        {isOpen ? (
          <XIcon className="h-5 w-5 text-primary" />
        ) : (
          <MenuIcon className="h-5 w-5 text-primary" />
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
        id="account-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Account navigation"
        aria-hidden={!isOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-70 flex w-72 max-w-[85vw] flex-col border-r border-outline-variant bg-surface-container-lowest transition-transform duration-300 ease-out lg:hidden",
          isOpen ? "translate-x-0" : "pointer-events-none -translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-outline-variant px-5">
          <span className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface">
            My Account
          </span>
          <button
            type="button"
            aria-label="Close account menu"
            onClick={() => setIsOpen(false)}
            className="text-primary hover:opacity-70"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <nav
          aria-label="Account navigation"
          className="flex flex-1 flex-col gap-1 overflow-y-auto p-5"
        >
          {accountNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <AccountNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                isActive={isActive}
                onNavigate={() => setIsOpen(false)}
              />
            );
          })}
        </nav>
      </aside>

      <nav
        aria-label="Account navigation"
        className="hidden flex-col gap-1 lg:flex"
      >
        {accountNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <AccountNavLink
              key={item.href}
              href={item.href}
              label={item.label}
              isActive={isActive}
              className="w-full"
            />
          );
        })}
      </nav>
    </>
  );
}
