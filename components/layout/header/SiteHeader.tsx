import Link from "next/link";
import { CartIcon, SearchIcon, UserIcon } from "@/components/icons";
import { Container } from "@/components/ui";
import { navLinks } from "@/data/landing";
import { cn } from "@/lib/utils";
import Image from "next/image";
import logo from "@/public/logo.png";

type SiteHeaderProps = {
  variant?: "transparent" | "solid";
  className?: string;
};

export function SiteHeader({ variant = "solid", className }: SiteHeaderProps) {
  const isTransparent = variant === "transparent";

  return (
    <header
      className={cn(
        "z-50 w-full",
        isTransparent
          ? "absolute inset-x-0 top-0 bg-transparent"
          : "bg-surface-container-lowest",
        className,
      )}
    >
      <Container className="flex h-16 items-center justify-between md:h-20">
        <Link href="/" aria-label="Velvorz home">
          <Image
            src={logo}
            alt="Velvorz"
            height={36}
            loading="eager"
            className={cn(
              "h-9 w-auto object-contain md:h-11",
              isTransparent && "brightness-0 invert",
            )}
          />
        </Link>

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 md:block"
          aria-label="Main navigation"
        >
          <ul className="flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "type-label-uppercase hover:opacity-70",
                    isTransparent ? "text-on-primary" : "text-on-surface",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div
          className={cn(
            "flex items-center gap-4",
            isTransparent ? "text-on-primary" : "text-primary",
          )}
        >
          <button
            type="button"
            aria-label="Search"
            className="hover:opacity-70"
          >
            <SearchIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Account"
            className="hover:opacity-70"
          >
            <UserIcon className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Cart" className="hover:opacity-70">
            <CartIcon className="h-5 w-5" />
          </button>
        </div>
      </Container>
    </header>
  );
}
