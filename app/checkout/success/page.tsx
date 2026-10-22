import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { getOrderByNumber } from "@/app/checkout/actions";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { Button, Container } from "@/components/ui";
import {
  formatPaymentMethodLabel,
  normalizePaymentStatus,
  ORDER_STATUS_LABELS,
  orderStatusBadgeClass,
  PAYMENT_STATUS_LABELS,
  paymentStatusBadgeClass,
} from "@/lib/order-status";
import { cn, formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order Confirmed | VELVORZ",
  description: "Thank you for your VELVORZ order.",
};

type CheckoutSuccessPageProps = {
  searchParams: Promise<{ orderNumber?: string }>;
};

async function OrderConfirmationDetails({ orderNumber }: { orderNumber: string }) {
  const order = await getOrderByNumber(orderNumber);
  if (!order) return null;

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <span
          className={cn(
            "font-label inline-block border px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] leading-none",
            orderStatusBadgeClass(order.status),
          )}
        >
          Order · {ORDER_STATUS_LABELS[order.status]}
        </span>
        <span
          className={cn(
            "font-label inline-block border px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] leading-none",
            paymentStatusBadgeClass(normalizePaymentStatus(order.payment_status)),
          )}
        >
          Payment · {PAYMENT_STATUS_LABELS[normalizePaymentStatus(order.payment_status)]}
        </span>
      </div>

      <div className="mt-8 rounded-sm border border-outline-variant bg-surface-container-lowest p-6 shadow-xs md:p-8">
        <h2 className="font-headline text-lg font-bold uppercase text-on-surface">
          Order Summary
        </h2>

        {order.order_items && order.order_items.length > 0 ? (
          <ul className="mt-4 divide-y divide-outline-variant border-b border-outline-variant pb-4">
            {order.order_items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-3">
                {item.image ? (
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-surface-container-low">
                    <Image
                      src={item.image}
                      alt={item.product_name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-body text-sm font-semibold text-on-surface">
                    {item.product_name}
                  </p>
                  <p className="font-body text-xs text-on-surface-variant">
                    {[item.color, item.size].filter(Boolean).join(" / ")}
                    {item.quantity > 1 ? ` · Qty ${item.quantity}` : ""}
                  </p>
                </div>
                <p className="font-body text-sm font-medium tabular-nums text-on-surface">
                  {formatPrice(item.unit_price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        ) : null}

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="font-body text-on-surface-variant">Subtotal</dt>
            <dd className="font-body font-medium tabular-nums text-on-surface">
              {formatPrice(order.subtotal)}
            </dd>
          </div>
          {order.discount && order.discount > 0 ? (
            <div className="flex justify-between">
              <dt className="font-body text-on-surface-variant">
                Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}
              </dt>
              <dd className="font-body font-medium tabular-nums text-green-700">
                -{formatPrice(order.discount)}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="font-body text-on-surface-variant">Shipping</dt>
            <dd className="font-body font-medium tabular-nums text-on-surface">
              {order.shipping === 0 ? "Free" : formatPrice(order.shipping)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-outline-variant pt-2">
            <dt className="font-headline font-bold uppercase text-on-surface">Total</dt>
            <dd className="font-headline text-lg font-extrabold tabular-nums text-on-surface">
              {formatPrice(order.total)}
            </dd>
          </div>
        </dl>

        {order.shipping_address ? (
          <div className="mt-6 border-t border-outline-variant pt-4 text-left">
            <p className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
              Delivering to
            </p>
            <p className="font-body mt-2 text-sm text-on-surface">
              {order.shipping_address.fullName || order.customer_name}
              <br />
              {order.shipping_address.line1}
              {order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ""}
              <br />
              {order.shipping_address.city}, {order.shipping_address.state}{" "}
              {order.shipping_address.postalCode}
              <br />
              {order.shipping_address.country}
              <br />
              Phone: {order.shipping_address.phone || order.customer_phone}
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const { orderNumber } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-surface-container-lowest py-10 md:py-16">
        <Container>
          <div className="mx-auto max-w-2xl">
            {/* Header / Success Badge */}
            <div className="rounded-sm border border-outline-variant bg-surface-container-lowest p-6 text-center shadow-xs md:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-600/10 text-2xl text-green-600">
                ✓
              </div>

              <p className="font-label mt-4 text-xs font-bold uppercase tracking-[0.2em] text-green-600">
                Order Placed Successfully
              </p>
              <h1 className="font-headline mt-2 text-2xl font-extrabold uppercase tracking-tight text-on-surface md:text-4xl">
                Thank You For Your Order
              </h1>
              <p className="font-body mt-3 text-sm text-on-surface-variant leading-relaxed">
                We have received your order and are preparing it for shipment. You will pay with{" "}
                <strong className="text-on-surface">
                  {formatPaymentMethodLabel("cash_on_delivery")}
                </strong>{" "}
                when the package arrives.
              </p>

              {orderNumber ? (
                <div className="mt-6 inline-block rounded-md border border-outline-variant bg-surface-container-low px-4 py-2">
                  <span className="font-label text-xs font-bold uppercase text-on-surface-variant">
                    Order Reference:{" "}
                  </span>
                  <span className="font-headline text-sm font-extrabold text-on-surface">
                    {orderNumber}
                  </span>
                </div>
              ) : null}
            </div>

            {orderNumber ? (
              <Suspense fallback={null}>
                <OrderConfirmationDetails orderNumber={orderNumber} />
              </Suspense>
            ) : null}

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button href="/shop" className="py-3 px-8 text-xs font-bold uppercase tracking-[0.15em]">
                Continue Shopping
              </Button>
              <Button
                href="/account/orders"
                variant="ghost"
                className="py-3 px-8 text-xs font-bold uppercase tracking-[0.15em]"
              >
                View Account Orders
              </Button>
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
