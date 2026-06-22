"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LogOutIcon, MenuIcon, XIcon } from "@/components/icons";
import logo from "@/public/logo.png";
import { cn } from "@/lib/utils";
import { AdminNav } from "./AdminNav";

type AdminShellProps = {
  adminEmail?: string;
  signOutAction: () => Promise<void>;
  children: ReactNode;
};

function SidebarInner({
  adminEmail,
  signOutAction,
  onClose,
}: {
  adminEmail?: string;
  signOutAction: () => Promise<void>;
  onClose?: () => void;
}) {
  return (
    <>
      {/* Sidebar header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-on-primary/10 px-5">
        <Link
          href="/admin"
          onClick={onClose}
          className="flex items-center gap-2.5"
          aria-label="Admin home"
        >
          <Image
            src={logo}
            alt="Velvorz"
            height={28}
            className="h-7 w-auto object-contain brightness-0 invert"
          />
        </Link>
        {onClose && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="text-on-primary/70 hover:text-on-primary lg:hidden"
          >
            <XIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Section label */}
      <div className="px-6 pt-6 pb-2">
        <p className="font-label text-[10px] font-bold uppercase tracking-[0.2em] leading-none text-on-primary/40">
          Admin Panel
        </p>
      </div>

      {/* Nav links */}
      <AdminNav />

      {/* Sidebar footer — user + sign out */}
      <div className="shrink-0 border-t border-on-primary/10 px-4 py-4">
        {adminEmail && (
          <p
            className="mb-3 truncate font-body text-[11px] leading-none text-on-primary/50"
            title={adminEmail}
          >
            {adminEmail}
          </p>
        )}
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2.5 font-label text-xs font-bold uppercase tracking-[0.12em] leading-none text-on-primary/55 transition-colors hover:bg-on-primary/8 hover:text-on-primary"
          >
            <LogOutIcon className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </form>
      </div>
    </>
  );
}

export function AdminShell({
  adminEmail,
  signOutAction,
  children,
}: AdminShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isDrawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsDrawerOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen]);

  return (
    <div className="flex min-h-screen bg-surface-container-lowest">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 xl:w-64 lg:shrink-0 bg-primary text-on-primary sticky top-0 h-screen overflow-y-auto">
        <SidebarInner adminEmail={adminEmail} signOutAction={signOutAction} />
      </aside>

      {/* ── Mobile overlay ── */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden",
          isDrawerOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={() => setIsDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* ── Mobile drawer ── */}
      <aside
        id="admin-mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
        aria-hidden={!isDrawerOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-primary text-on-primary transition-transform duration-300 ease-out lg:hidden",
          isDrawerOpen
            ? "translate-x-0"
            : "-translate-x-full pointer-events-none",
        )}
      >
        <SidebarInner
          adminEmail={adminEmail}
          signOutAction={signOutAction}
          onClose={() => setIsDrawerOpen(false)}
        />
      </aside>

      {/* ── Main column ── */}
      <div className="flex min-h-screen flex-1 flex-col min-w-0">
        {/* Mobile top header */}
        <header className="lg:hidden sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-4">
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={isDrawerOpen}
            aria-controls="admin-mobile-drawer"
            onClick={() => setIsDrawerOpen(true)}
            className="text-primary hover:opacity-70"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <Link href="/admin" aria-label="Admin home">
            <Image
              src={logo}
              alt="Velvorz"
              height={26}
              className="h-[26px] w-auto object-contain"
            />
          </Link>

          {/* Right spacer to keep logo centred */}
          <div className="w-5" aria-hidden="true" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 md:p-8 lg:p-10">
          {children}
        </main>

        {/* Admin footer */}
        <footer className="shrink-0 border-t border-outline-variant px-5 py-4 md:px-8 lg:px-10">
          <p className="font-label text-[10px] font-bold uppercase tracking-[0.15em] leading-none text-on-surface-variant text-center">
            © {new Date().getFullYear()} VELVORZ — Admin Panel
          </p>
        </footer>
      </div>
    </div>
  );
}
