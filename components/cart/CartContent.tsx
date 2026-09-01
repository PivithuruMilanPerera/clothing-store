"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui";
import { getColorLabel } from "@/lib/cart";
import { cn, formatPrice } from "@/lib/utils";

export function CartContent() {
  const {
    items,
    subtotal,
    updateQuantity,
    removeItem,
    stockStatus,
    hasOutOfStockItems,
    hasStockMismatch,
    isUserCart,
    isCheckingStock,
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-16 text-center md:py-24">
        <h1 className="font-headline text-[2rem] font-extrabold leading-tight uppercase md:text-5xl md:tracking-tight text-on-surface">
          Your Cart Is Empty
        </h1>
        <p className="font-body text-base leading-normal mt-4 text-on-surface-variant">
          Add pieces from the collection to continue.
        </p>
        <Button href="/shop" className="mt-8">
          Shop Now
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,24rem)] lg:gap-16">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-outline-variant pb-4">
          <div>
            <h1 className="font-headline text-[2rem] font-extrabold leading-tight uppercase md:text-5xl md:tracking-tight text-on-surface">
              Your Bag
            </h1>
            <p className="font-body text-base leading-normal mt-2 text-on-surface-variant">
              {items.length} {items.length === 1 ? "item" : "items"}
              {isUserCart ? (
                <span className="ml-2 font-label text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
                  • Saved to Account
                </span>
              ) : (
                <span className="ml-2 font-label text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
                  • Guest Session
                </span>
              )}
            </p>
          </div>

          {isCheckingStock ? (
            <span className="font-body text-xs text-on-surface-variant animate-pulse">
              Verifying real-time stock...
            </span>
          ) : null}
        </div>

        {/* Real-time stock alerts */}
        {hasOutOfStockItems ? (
          <div className="mt-6 rounded-sm border border-error/30 bg-error/10 p-4">
            <p className="font-body text-sm font-semibold text-error">
              Some items in your bag are currently out of stock. Please remove them to proceed to checkout.
            </p>
          </div>
        ) : hasStockMismatch ? (
          <div className="mt-6 rounded-sm border border-orange-400/30 bg-orange-400/10 p-4">
            <p className="font-body text-sm font-semibold text-orange-400">
              Item quantities have been adjusted to reflect live available inventory.
            </p>
          </div>
        ) : null}

        <ul className="divide-y divide-outline-variant">
          {items.map((item) => {
            const status = stockStatus[item.id];
            const isOutOfStock = status ? status.isOutOfStock : item.isOutOfStock ?? false;
            const isLowStock = status ? status.isLowStock : item.isLowStock ?? false;
            const availableStock = status?.availableStock ?? item.availableStock ?? 999;
            const isMaxReached = item.quantity >= availableStock;

            return (
              <li
                key={item.id}
                className={cn(
                  "grid gap-4 py-6 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-6 transition-opacity",
                  isOutOfStock && "opacity-80",
                )}
              >
                <Link
                  href={`/products/${item.slug}`}
                  className="relative aspect-square overflow-hidden bg-surface-container-low"
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="112px"
                    className="object-cover object-center"
                  />
                  {isOutOfStock ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-1 text-center font-label text-[9px] font-bold uppercase tracking-wider text-white">
                      Out of Stock
                    </div>
                  ) : null}
                </Link>

                <div className="flex min-w-0 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/products/${item.slug}`}
                        className="font-headline block text-sm font-bold uppercase text-on-surface hover:opacity-70 md:text-base"
                      >
                        {item.name}
                      </Link>
                      <p className="font-body text-sm leading-normal mt-1 text-on-surface-variant">
                        {getColorLabel(item.color, undefined, item.colorName)} / {item.size}
                      </p>

                      {/* Real-time stock status badge */}
                      <div className="mt-2">
                        {isOutOfStock ? (
                          <span className="font-label inline-flex items-center gap-1 rounded bg-error/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-error">
                            ● Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="font-label inline-flex items-center gap-1 rounded bg-orange-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-orange-400">
                            ● Only {availableStock} left in stock
                          </span>
                        ) : (
                          <span className="font-label inline-flex items-center gap-1 rounded bg-green-600/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-green-600">
                            ● In Stock
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="font-body text-base leading-normal shrink-0 font-medium tabular-nums text-on-surface">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center border border-outline-variant bg-surface-container-lowest">
                      <button
                        type="button"
                        disabled={item.quantity <= 1}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none px-3 py-2 text-on-surface hover:bg-surface-container-low transition-colors disabled:pointer-events-none disabled:opacity-30"
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        -
                      </button>
                      <span className="font-body text-sm leading-normal min-w-10 border-x border-outline-variant px-3 py-2 text-center font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={isOutOfStock || isMaxReached}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none px-3 py-2 text-on-surface hover:bg-surface-container-low transition-colors disabled:pointer-events-none disabled:opacity-30"
                        aria-label={`Increase quantity of ${item.name}`}
                        title={isMaxReached ? "Maximum available stock reached" : undefined}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="font-body text-sm leading-normal text-on-surface-variant underline underline-offset-4 hover:text-error transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="h-fit border border-outline-variant p-6 md:p-8 bg-surface-container-lowest">
        <h2 className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface">
          Order Summary
        </h2>

        <dl className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <dt className="font-body text-base leading-normal text-on-surface-variant">Subtotal</dt>
            <dd className="font-body text-base leading-normal font-medium tabular-nums text-on-surface">
              {formatPrice(subtotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="font-body text-base leading-normal text-on-surface-variant">Shipping</dt>
            <dd className="font-body text-base leading-normal text-on-surface-variant">
              Calculated at checkout
            </dd>
          </div>
          <div
            className={cn(
              "flex items-center justify-between gap-4 border-t border-outline-variant pt-4",
            )}
          >
            <dt className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface">Total</dt>
            <dd className="font-body text-lg leading-relaxed font-medium tabular-nums text-on-surface">
              {formatPrice(subtotal)}
            </dd>
          </div>
        </dl>

        <Button
          href={hasOutOfStockItems || items.length === 0 ? undefined : "/checkout"}
          className={cn(
            "mt-8 w-full py-4 uppercase tracking-[0.15em] font-bold text-xs transition-all",
            hasOutOfStockItems && "cursor-not-allowed opacity-50",
          )}
          disabled={hasOutOfStockItems || items.length === 0}
        >
          {hasOutOfStockItems ? "Remove Out of Stock Items" : "Proceed to Checkout"}
        </Button>

        {hasOutOfStockItems ? (
          <p className="font-body text-xs text-center mt-2 text-error">
            Cannot checkout while out-of-stock items are in your bag.
          </p>
        ) : null}

        <Button href="/shop" variant="ghost" className="mt-3 w-full py-4 uppercase tracking-[0.15em] font-bold text-xs">
          Continue Shopping
        </Button>
      </aside>
    </div>
  );
}
