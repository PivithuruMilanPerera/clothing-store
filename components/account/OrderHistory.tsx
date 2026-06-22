import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui";
import type { Order, OrderStatus } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

type OrderHistoryProps = {
  orders: Order[];
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function OrderHistory({ orders }: OrderHistoryProps) {
  if (orders.length === 0) {
    return (
      <div className="border border-outline-variant bg-surface-container-lowest py-16 text-center md:py-24">
        <h2 className="font-headline text-lg font-bold leading-tight md:text-2xl text-on-surface">No Orders Yet</h2>
        <p className="font-body text-base leading-normal mt-4 text-on-surface-variant">
          When you place an order, it will appear here.
        </p>
        <Button href="/shop" className="mt-8">
          Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <article
          key={order.id}
          className="border border-outline-variant bg-surface-container-lowest"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant px-5 py-4 md:px-6">
            <div>
              <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface">
                Order {order.order_number}
              </p>
              <p className="font-body text-base leading-normal mt-1 text-on-surface-variant">
                Placed on {formatDate(order.created_at)}
              </p>
            </div>
            <div className="text-right">
              <span
                className={cn(
                  "font-label text-xs font-bold uppercase tracking-[0.15em] leading-none inline-block border px-3 py-1",
                  order.status === "delivered"
                    ? "border-primary text-primary"
                    : "border-outline-variant text-on-surface-variant",
                )}
              >
                {statusLabels[order.status]}
              </span>
              <p className="font-body text-base leading-normal mt-2 font-medium tabular-nums text-on-surface">
                {formatPrice(Number(order.total))}
              </p>
            </div>
          </div>

          <ul className="divide-y divide-outline-variant">
            {(order.order_items ?? []).map((item) => (
              <li
                key={item.id}
                className="grid gap-4 px-5 py-5 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-center md:px-6"
              >
                <div className="relative aspect-square overflow-hidden bg-surface-container-low">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.product_name}
                      fill
                      sizes="80px"
                      className="object-cover object-center"
                    />
                  ) : null}
                </div>

                <div className="min-w-0">
                  {item.product_slug ? (
                    <Link
                      href={`/products/${item.product_slug}`}
                      className="font-headline block text-sm font-bold uppercase text-on-surface hover:opacity-70"
                    >
                      {item.product_name}
                    </Link>
                  ) : (
                    <p className="font-headline text-sm font-bold uppercase text-on-surface">
                      {item.product_name}
                    </p>
                  )}
                  <p className="font-body text-base leading-normal mt-2 text-on-surface-variant">
                    {[item.color, item.size].filter(Boolean).join(" / ")}
                    {item.quantity > 1 ? ` · Qty ${item.quantity}` : ""}
                  </p>
                </div>

                <p className="font-body text-base leading-normal tabular-nums text-on-surface">
                  {formatPrice(Number(item.unit_price) * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
