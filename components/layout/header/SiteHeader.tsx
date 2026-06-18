import Link from "next/link";
import { UserIcon } from "@/components/icons";
import { Container } from "@/components/ui";
import { cn } from "@/lib/utils";
import Image from "next/image";
import logo from "@/public/logo.png";
import { CartLink } from "./CartLink";
import { HeaderNav } from "./HeaderNav";
import { HeaderSearch } from "./HeaderSearch";

type SiteHeaderProps = {
  variant?: "transparent" | "solid";
  className?: string;
};

export function SiteHeader({ variant = "solid", className }: SiteHeaderProps) {
  const isTransparent = variant === "transparent";

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

        <HeaderNav isTransparent={isTransparent} />

        <div
          className={cn(
            "flex items-center gap-4",
            isTransparent ? "text-on-primary" : "text-primary",
          )}
        >
          <HeaderSearch isTransparent={isTransparent} />
          <Link
            href="/login"
            aria-label="Account"
            className="hover:opacity-70"
          >
            <UserIcon className="h-5 w-5" />
          </Link>
          <CartLink />
        </div>
      </Container>
    </header>
  );
}
