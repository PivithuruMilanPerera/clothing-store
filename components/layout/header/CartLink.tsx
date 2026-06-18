"use client";

import Link from "next/link";
import { useCart } from "@/components/cart";
import { CartIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type CartLinkProps = {
  className?: string;
};

export function CartLink({ className }: CartLinkProps) {
  const { itemCount, isHydrated } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={itemCount > 0 ? `Cart, ${itemCount} items` : "Cart"}
      className={cn("relative hover:opacity-70", className)}
    >
      <CartIcon className="h-5 w-5" />
      {isHydrated && itemCount > 0 ? (
        <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center bg-primary px-1 text-[10px] font-bold text-on-primary">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      ) : null}
    </Link>
  );
}
