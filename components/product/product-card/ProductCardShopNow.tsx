"use client";

import { useLinkStatus } from "next/link";
import { LoadingCircle } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Hover + navigation pending overlay for product cards (must render inside a Link). */
export function ProductCardShopNow() {
  const { pending } = useLinkStatus();

  return (
    <>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/15",
          pending && "bg-black/15",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-primary py-3 text-center transition-transform duration-500 ease-out group-hover:translate-y-0",
          pending && "translate-y-0",
        )}
      >
        <span className="font-label inline-flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-on-primary md:text-[11px]">
          {pending ? (
            <LoadingCircle className="border-on-primary border-t-transparent" />
          ) : null}
          Shop Now
        </span>
      </div>
    </>
  );
}
