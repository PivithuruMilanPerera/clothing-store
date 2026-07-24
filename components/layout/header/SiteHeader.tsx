import Link from "next/link";
import { Container } from "@/components/ui";
import { cn } from "@/lib/utils";
import Image from "next/image";
import logo from "@/public/logo.png";
import { getMainCategoryLinks } from "@/lib/categories";
import type { NavLink } from "@/lib/types";
import { CartLink } from "./CartLink";
import { HeaderAccountLink } from "./HeaderAccountLink";
import { HeaderNav } from "./HeaderNav";
import { HeaderSearch } from "./HeaderSearch";
import { MobileNavDrawer } from "./MobileNavDrawer";

type SiteHeaderProps = {
  variant?: "transparent" | "solid";
  className?: string;
};

export async function SiteHeader({ variant = "solid", className }: SiteHeaderProps) {
  const isTransparent = variant === "transparent";
  const mainCategoryLinks = await getMainCategoryLinks();
  const navLinks: NavLink[] = [
    { label: "Home", href: "/" },
    ...mainCategoryLinks,
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header
      className={cn(
        "relative z-50 w-full",
        isTransparent
          ? "absolute inset-x-0 top-0 bg-transparent"
          : "bg-surface-container-lowest",
        className,
      )}
    >
      <Container className="flex h-16 items-center justify-between md:h-20">
        <div className="flex items-center gap-4">
          <MobileNavDrawer isTransparent={isTransparent} navLinks={navLinks} />
          <Link href="/" aria-label="Velvorz home">
            <Image
              src={logo}
              alt="Velvorz"
              height={40}
              loading="eager"
              className={cn(
                "h-10 w-auto object-contain md:h-12",
                isTransparent && "brightness-0 invert",
              )}
            />
          </Link>
        </div>

        <HeaderNav isTransparent={isTransparent} navLinks={navLinks} />

        <div
          className={cn(
            "flex items-center gap-4",
            isTransparent ? "text-on-primary" : "text-primary",
          )}
        >
          <HeaderSearch isTransparent={isTransparent} />
          <HeaderAccountLink isTransparent={isTransparent} />
          <CartLink />
        </div>
      </Container>
    </header>
  );
}
