"use client";

import {
  BadgePercent,
  BarChart3,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  Mail,
  PackageSearch,
  RotateCcw,
  Shirt,
  ShieldCheck,
  ShoppingBag,
  Tags,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

type AdminNavItem = { label: string; href: string; icon: LucideIcon };

type AdminNavSection = {
  label: string;
  items: AdminNavItem[];
  superAdminOnly?: boolean;
};

const adminNavSections: AdminNavSection[] = [
  {
    label: "Operations",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
      { label: "Returns", href: "/admin/returns", icon: RotateCcw },
      { label: "Customers", href: "/admin/users", icon: Users },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: Shirt },
      { label: "Categories", href: "/admin/categories", icon: FolderTree },
      { label: "Brands", href: "/admin/brands", icon: Tags },
      { label: "Coupons", href: "/admin/coupons", icon: BadgePercent },
      { label: "Banner & Logo", href: "/admin/banner-logo", icon: ImageIcon },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Delivery Rates", href: "/admin/settings/delivery", icon: Truck },
      {
        label: "Stock Thresholds",
        href: "/admin/settings/stock",
        icon: PackageSearch,
      },
      { label: "Email Templates", href: "/admin/settings/emails", icon: Mail },
    ],
  },
  {
    label: "Super Admin",
    superAdminOnly: true,
    items: [
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
      { label: "Admin Accounts", href: "/admin/admins", icon: ShieldCheck },
    ],
  },
];

export function AdminNav({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  const sections = adminNavSections.filter(
    (section) => !section.superAdminOnly || role === "super_admin",
  );

  return (
    <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto py-4 px-3">
      <div className="space-y-5">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-2 font-label text-[10px] font-bold uppercase tracking-[0.2em] leading-none text-on-primary/40">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
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
          </div>
        ))}
      </div>
    </nav>
  );
}
