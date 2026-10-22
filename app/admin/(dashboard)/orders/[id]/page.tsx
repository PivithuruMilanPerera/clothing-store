import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AdminBadge,
  AdminPanel,
  formatAdminDate,
} from "@/components/admin/AdminUi";
import { OrderStatusControls } from "@/components/admin/orders/OrderStatusControls";
import { getOrderForAdmin } from "@/lib/orders";
import {
  formatPaymentMethodLabel,
  normalizePaymentStatus,
  ORDER_STATUS_LABELS,
  orderStatusBadgeClass,
  PAYMENT_STATUS_LABELS,
  paymentStatusBadgeClass,
} from "@/lib/order-status";
import type { Order, OrderStatus } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order | Admin | VELVORZ",
};

function formatShippingAddress(address: Order["shipping_address"]) {
  if (!address) return [];

  return [
    address.fullName || [address.firstName, address.lastName].filter(Boolean).join(" "),
    address.company,
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
    address.district ? `${address.district} District` : "",
    address.country,
  ].filter((line): line is string => Boolean(line?.trim()));
}

function customerProfileHref(order: Order) {
  if (order.user_id) return `/admin/users/${order.user_id}`;
  const email = order.customer_email?.trim().toLowerCase();
  return email ? `/admin/users/${encodeURIComponent(`guest:${email}`)}` : null;
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getOrderForAdmin(id);

  if (!detail) {
    notFound();
  }

  const { order, history } = detail;
  const items = order.order_items ?? [];
  const paymentStatus = normalizePaymentStatus(order.payment_status);
  const addressLines = formatShippingAddress(order.shipping_address);
  const profileHref = customerProfileHref(order);
  const discount = Number(order.discount ?? 0);

  const timeline =
    history.length > 0
      ? history
      : [
          {
            id: "placed",
            status: order.status as OrderStatus,
            payment_status: paymentStatus,
            tracking_number: null,
            note: "Order placed",
            changed_by_email: null,
            created_at: order.created_at,
          },
        ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/orders"
          className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:text-on-surface"
        >
          ← All orders
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-headline text-2xl font-extrabold uppercase leading-tight tracking-tight text-on-surface md:text-3xl">
            Order {order.order_number}
          </h1>
          <AdminBadge className={orderStatusBadgeClass(order.status)}>
            {ORDER_STATUS_LABELS[order.status]}
          </AdminBadge>
          <AdminBadge className={paymentStatusBadgeClass(paymentStatus)}>
            Pay · {PAYMENT_STATUS_LABELS[paymentStatus]}
          </AdminBadge>
        </div>
        <p className="font-body mt-2 text-sm text-on-surface-variant">
          Placed {formatAdminDate(order.created_at)} · Last updated{" "}
          {formatAdminDate(order.updated_at)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AdminPanel title={`Items (${items.reduce((sum, item) => sum + item.quantity, 0)})`}>
            {items.length === 0 ? (
              <p className="font-body text-sm text-on-surface-variant">
                No line items were saved for this order.
              </p>
            ) : (
              <ul className="divide-y divide-outline-variant">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 py-3 sm:grid-cols-[3.5rem_minmax(0,1fr)_auto] sm:gap-4"
                  >
                    <div className="relative aspect-square w-12 overflow-hidden bg-surface-container-low sm:w-14">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.product_name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      {item.product_slug ? (
                        <Link
                          href={`/admin/products?q=${encodeURIComponent(item.product_slug)}`}
                          className="font-headline block truncate text-sm font-bold uppercase text-on-surface hover:underline"
                        >
                          {item.product_name}
                        </Link>
                      ) : (
                        <p className="font-headline truncate text-sm font-bold uppercase text-on-surface">
                          {item.product_name}
                        </p>
                      )}
                      <p className="font-body mt-1 text-xs text-on-surface-variant">
                        {[item.color, item.size].filter(Boolean).join(" / ")} · Qty{" "}
                        {item.quantity} × {formatPrice(Number(item.unit_price))}
                      </p>
                    </div>
                    <p className="font-body text-sm tabular-nums text-on-surface">
                      {formatPrice(Number(item.unit_price) * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <dl className="mt-4 space-y-2 border-t border-outline-variant pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="font-body text-on-surface-variant">Subtotal</dt>
                <dd className="font-body tabular-nums">{formatPrice(Number(order.subtotal))}</dd>
              </div>
              {discount > 0 ? (
                <div className="flex justify-between">
                  <dt className="font-body text-on-surface-variant">
                    Discount {order.coupon_code ? `(${order.coupon_code})` : ""}
                  </dt>
                  <dd className="font-body tabular-nums text-green-700">
                    -{formatPrice(discount)}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="font-body text-on-surface-variant">Shipping</dt>
                <dd className="font-body tabular-nums">
                  {Number(order.shipping) === 0 ? "Free" : formatPrice(Number(order.shipping))}
                </dd>
              </div>
              <div className="flex justify-between border-t border-outline-variant pt-2 text-base font-bold">
                <dt className="font-headline uppercase">Total</dt>
                <dd className="font-headline tabular-nums">{formatPrice(Number(order.total))}</dd>
              </div>
            </dl>
          </AdminPanel>

          <AdminPanel title="Tracking history">
            <ol className="relative space-y-5 border-l border-outline-variant pl-5">
              {[...timeline].reverse().map((entry, index) => (
                <li key={entry.id} className="relative">
                  <span
                    className={`absolute -left-[1.625rem] top-1 h-3 w-3 rounded-full border-2 border-surface-container-lowest ${
                      index === 0 ? "bg-primary" : "bg-outline-variant"
                    }`}
                    aria-hidden="true"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminBadge className={orderStatusBadgeClass(entry.status)}>
                      {ORDER_STATUS_LABELS[entry.status] ?? entry.status}
                    </AdminBadge>
                    {entry.payment_status ? (
                      <span className="font-body text-xs text-on-surface-variant">
                        Payment {entry.payment_status}
                      </span>
                    ) : null}
                  </div>
                  {entry.note ? (
                    <p className="font-body mt-1.5 text-sm text-on-surface">{entry.note}</p>
                  ) : null}
                  {entry.tracking_number ? (
                    <p className="font-body mt-1 text-xs text-on-surface-variant">
                      Tracking: {entry.tracking_number}
                    </p>
                  ) : null}
                  <p className="font-body mt-1 text-xs text-on-surface-variant">
                    {formatAdminDate(entry.created_at)}
                    {entry.changed_by_email ? ` · by ${entry.changed_by_email}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          </AdminPanel>
        </div>

        <div className="space-y-6">
          <AdminPanel title="Update order">
            <OrderStatusControls order={order} />
          </AdminPanel>

          <AdminPanel
            title="Customer"
            actions={
              profileHref ? (
                <Link
                  href={profileHref}
                  className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:text-on-surface"
                >
                  Profile →
                </Link>
              ) : null
            }
          >
            <p className="font-body text-sm text-on-surface">
              {order.customer_name || "Guest customer"}
              {order.is_guest ? " (guest)" : ""}
            </p>
            <p className="font-body mt-1 text-sm text-on-surface-variant">
              {order.customer_email || "No email"}
            </p>
            {order.customer_phone ? (
              <p className="font-body mt-1 text-sm text-on-surface-variant">
                {order.customer_phone}
              </p>
            ) : null}

            <p className="font-label mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
              Shipping address
            </p>
            {addressLines.length > 0 ? (
              <div className="font-body mt-2 space-y-0.5 text-sm text-on-surface">
                {addressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : (
              <p className="font-body mt-2 text-sm text-on-surface-variant">
                No shipping address on file.
              </p>
            )}

            <p className="font-label mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
              Payment
            </p>
            <p className="font-body mt-2 text-sm text-on-surface">
              {formatPaymentMethodLabel(order.payment_method)}
            </p>
            {order.tracking_number ? (
              <>
                <p className="font-label mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                  Tracking number
                </p>
                <p className="font-body mt-2 text-sm font-semibold text-on-surface">
                  {order.tracking_number}
                </p>
              </>
            ) : null}
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
