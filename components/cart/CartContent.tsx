"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui";
import { colorLabels } from "@/lib/cart";
import { cn } from "@/lib/utils";

export function CartContent() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-16 text-center md:py-24">
        <h1 className="type-headline-lg-mobile md:type-headline-lg text-on-surface">
          Your Bag Is Empty
        </h1>
        <p className="type-body-md mt-4 text-on-surface-variant">
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
        <div className="border-b border-outline-variant pb-4">
          <h1 className="type-headline-lg-mobile md:type-headline-lg text-on-surface">
            Your Bag
          </h1>
          <p className="type-body-md mt-2 text-on-surface-variant">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>

        <ul className="divide-y divide-outline-variant">
          {items.map((item) => (
            <li
              key={item.id}
              className="grid gap-4 py-6 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-6"
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
              </Link>

              <div className="flex min-w-0 flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      className="type-headline-md block text-sm font-bold uppercase text-on-surface hover:opacity-70 md:text-base"
                    >
                      {item.name}
                    </Link>
                    <p className="type-body-md mt-2 text-on-surface-variant">
                      {colorLabels[item.color]} / {item.size}
                    </p>
                  </div>
                  <p className="type-body-md shrink-0 font-medium tabular-nums text-on-surface">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center border border-outline-variant">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.id, item.quantity - 1)
                      }
                      className="type-label-uppercase px-3 py-2 text-on-surface hover:bg-surface-container-low"
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      -
                    </button>
                    <span className="type-body-md min-w-10 border-x border-outline-variant px-3 py-2 text-center tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.id, item.quantity + 1)
                      }
                      className="type-label-uppercase px-3 py-2 text-on-surface hover:bg-surface-container-low"
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="type-body-md text-on-surface-variant underline underline-offset-4 hover:text-on-surface"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className="h-fit border border-outline-variant p-6 md:p-8">
        <h2 className="type-label-uppercase text-on-surface">Order Summary</h2>

        <dl className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <dt className="type-body-md text-on-surface-variant">Subtotal</dt>
            <dd className="type-body-md font-medium tabular-nums text-on-surface">
              ${subtotal.toFixed(2)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="type-body-md text-on-surface-variant">Shipping</dt>
            <dd className="type-body-md text-on-surface-variant">
              Calculated at checkout
            </dd>
          </div>
          <div
            className={cn(
              "flex items-center justify-between gap-4 border-t border-outline-variant pt-4",
            )}
          >
            <dt className="type-label-uppercase text-on-surface">Total</dt>
            <dd className="type-body-lg font-medium tabular-nums text-on-surface">
              ${subtotal.toFixed(2)}
            </dd>
          </div>
        </dl>

        <Button className="mt-8 w-full py-4">Checkout</Button>
        <Button href="/shop" variant="ghost" className="mt-3 w-full py-4">
          Continue Shopping
        </Button>
      </aside>
    </div>
  );
}
