"use client";

import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  markCashCollectedAction,
  setOrderPaymentStatusAction,
  setOrderStatusAction,
} from "@/app/admin/(dashboard)/orders/actions";
import { SearchIcon } from "@/components/icons";
import { Popup } from "@/components/ui";
import {
  formatPaymentMethodLabel,
  normalizePaymentStatus,
  ORDER_STATUS_LABELS,
  orderStatusBadgeClass,
  PAYMENT_STATUS_LABELS,
  paymentStatusBadgeClass,
} from "@/lib/order-status";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

type OrdersAdminProps = {
  orders: Order[];
};

type OrderStatusFilter = "all" | OrderStatus;
type PaymentStatusFilter = "all" | PaymentStatus;

const STATUS_FILTERS: { value: OrderStatusFilter; label: string }[] = [
  { value: "all", label: "All order statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_FILTERS: { value: PaymentStatusFilter; label: string }[] = [
  { value: "all", label: "All payment statuses" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
];

const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ["pending", "paid", "failed"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatShippingAddress(address: Order["shipping_address"]) {
  if (!address) {
    return null;
  }

  const lines = [
    address.fullName || [address.firstName, address.lastName].filter(Boolean).join(" "),
    address.company,
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
    address.country,
  ].filter((line) => Boolean(line?.trim()));

  return lines.length > 0 ? lines : null;
}

function matchesOrderSearch(order: Order, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const itemText = (order.order_items ?? [])
    .map((item) => [item.product_name, item.color, item.size].join(" "))
    .join(" ");

  return [
    order.order_number,
    order.customer_name,
    order.customer_email,
    order.customer_phone,
    order.user_id,
    itemText,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery));
}

function StatusBadge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={cn(
        "font-label inline-block border px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] leading-none",
        className,
      )}
    >
      {label}
    </span>
  );
}

function OrderRow({ order }: { order: Order }) {
  const router = useRouter();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const items = order.order_items ?? [];
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const shippingLines = formatShippingAddress(order.shipping_address);
  const paymentStatus = normalizePaymentStatus(order.payment_status);
  const isCod = order.payment_method === "cash_on_delivery";

  function handleOrderStatusChange(nextStatus: OrderStatus) {
    if (nextStatus === order.status) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      const result = await setOrderStatusAction(order.id, nextStatus);
      if (!result.success) {
        setActionError(result.error || "Failed to update order status.");
        return;
      }
      router.refresh();
    });
  }

  function handlePaymentStatusChange(nextStatus: PaymentStatus) {
    if (nextStatus === paymentStatus) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      const result = await setOrderPaymentStatusAction(order.id, nextStatus);
      if (!result.success) {
        setActionError(result.error || "Failed to update payment status.");
        return;
      }
      router.refresh();
    });
  }

  function handleMarkCashCollected() {
    setActionError(null);
    startTransition(async () => {
      const result = await markCashCollectedAction(order.id);
      if (!result.success) {
        setActionError(result.error || "Failed to mark cash collected.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <li className="border border-outline-variant bg-surface-container-lowest">
      <button
        type="button"
        onClick={() => setDetailsOpen(true)}
        className="w-full px-5 py-4 text-left md:px-6"
      >
        <div className="flex w-full flex-wrap items-start gap-x-3 gap-y-3">
          <div className="min-w-0 flex-1">
            <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface">
              Order {order.order_number}
            </p>
            <p className="font-body mt-2 text-sm text-on-surface">
              {order.customer_name || "Guest customer"}
            </p>
            <p className="font-body mt-1 text-sm text-on-surface-variant">
              {order.customer_email || "No email"}
              {order.customer_phone ? ` · ${order.customer_phone}` : ""}
            </p>
            <p className="font-body mt-1 text-xs text-on-surface-variant">
              {formatDate(order.created_at)}
              {order.is_guest ? " · Guest" : ""}
            </p>
          </div>

          <ChevronRight
            className="mt-1 h-4 w-4 shrink-0 text-on-surface-variant sm:order-3"
            aria-hidden="true"
          />

          <div className="flex w-full justify-end sm:order-2 sm:w-auto">
            <div className="flex flex-col items-end text-right">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <StatusBadge
                  label={ORDER_STATUS_LABELS[order.status]}
                  className={orderStatusBadgeClass(order.status)}
                />
                <StatusBadge
                  label={`Pay · ${PAYMENT_STATUS_LABELS[paymentStatus]}`}
                  className={paymentStatusBadgeClass(paymentStatus)}
                />
              </div>
              <p className="font-body mt-2 text-sm font-medium tabular-nums text-on-surface">
                {formatPrice(Number(order.total))}
              </p>
              <p className="font-body mt-1 text-xs text-on-surface-variant">
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>

        {items.length > 0 ? (
          <ul className="-mx-5 mt-4 flex gap-3 overflow-x-auto border-t border-outline-variant/40 px-5 pt-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
            {items.map((item) => (
              <li key={item.id} className="flex min-w-0 max-w-38 shrink-0 items-center gap-2">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden bg-surface-container-low">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.product_name}
                      fill
                      sizes="40px"
                      className="object-cover object-center"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="font-body truncate text-xs text-on-surface">
                    {item.product_name}
                  </p>
                  <p className="font-body mt-0.5 truncate text-[10px] text-on-surface-variant">
                    {[item.color, item.size].filter(Boolean).join(" / ")}
                    {item.quantity > 1 ? ` · ×${item.quantity}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </button>

      <Popup
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={`Order ${order.order_number}`}
        description={`${order.customer_name || "Guest customer"} · ${formatDate(order.created_at)}`}
        size="lg"
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              label={ORDER_STATUS_LABELS[order.status]}
              className={orderStatusBadgeClass(order.status)}
            />
            <StatusBadge
              label={`Pay · ${PAYMENT_STATUS_LABELS[paymentStatus]}`}
              className={paymentStatusBadgeClass(paymentStatus)}
            />
            <p className="font-body ml-auto text-sm font-medium tabular-nums text-on-surface">
              {formatPrice(Number(order.total))}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                Payment
              </p>
              <p className="font-body mt-2 text-sm text-on-surface">
                {formatPaymentMethodLabel(order.payment_method)}
              </p>
              <p className="font-body mt-1 text-sm text-on-surface-variant">
                Subtotal {formatPrice(Number(order.subtotal))} · Shipping{" "}
                {formatPrice(Number(order.shipping))}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                    Order status
                  </span>
                  <select
                    value={order.status}
                    disabled={isPending}
                    onChange={(event) =>
                      handleOrderStatusChange(event.target.value as OrderStatus)
                    }
                    className="font-body w-full border border-outline-variant/50 px-3 py-2 text-sm disabled:opacity-60"
                  >
                    {ORDER_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {ORDER_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                    Payment status
                  </span>
                  <select
                    value={paymentStatus}
                    disabled={isPending}
                    onChange={(event) =>
                      handlePaymentStatusChange(
                        event.target.value as PaymentStatus,
                      )
                    }
                    className="font-body w-full border border-outline-variant/50 px-3 py-2 text-sm disabled:opacity-60"
                  >
                    {PAYMENT_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {PAYMENT_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {isCod && paymentStatus === "pending" ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleMarkCashCollected}
                  className="font-label mt-3 border border-green-600/30 bg-green-600/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-green-600 hover:bg-green-600/15 disabled:opacity-60"
                >
                  Mark cash collected
                </button>
              ) : null}

              {actionError ? (
                <p className="font-body mt-2 text-xs text-error">{actionError}</p>
              ) : null}
            </div>

            <div>
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                Customer
              </p>
              <p className="font-body mt-2 text-sm text-on-surface">
                {order.customer_name || "Guest customer"}
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
              {shippingLines ? (
                <div className="font-body mt-2 space-y-0.5 text-sm text-on-surface">
                  {shippingLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              ) : (
                <p className="font-body mt-2 text-sm text-on-surface-variant">
                  No shipping address on file.
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
              Products
            </p>
            {items.length === 0 ? (
              <p className="font-body mt-3 text-sm text-on-surface-variant">
                No line items were saved for this order.
              </p>
            ) : (
              <ul className="-mx-1 mt-3 flex gap-3 overflow-x-auto pb-1 md:mx-0 md:grid md:gap-0 md:overflow-visible md:divide-y md:divide-outline-variant md:border-t md:border-outline-variant md:pb-0">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="w-28 shrink-0 md:grid md:w-auto md:shrink md:grid-cols-[4.5rem_minmax(0,1fr)_auto] md:items-center md:gap-4 md:py-4"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-surface-container-low md:w-[4.5rem]">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.product_name}
                          fill
                          sizes="(max-width: 768px) 112px, 72px"
                          className="object-cover object-center"
                        />
                      ) : null}
                    </div>
                    <div className="mt-2 min-w-0 md:mt-0">
                      <p className="font-headline truncate text-xs font-bold uppercase text-on-surface md:text-sm">
                        {item.product_name}
                      </p>
                      <p className="font-body mt-0.5 truncate text-[10px] text-on-surface-variant md:mt-1 md:text-sm">
                        {[item.color, item.size].filter(Boolean).join(" / ")}
                        {item.quantity > 1 ? ` · Qty ${item.quantity}` : ""}
                      </p>
                    </div>
                    <p className="font-body mt-1 text-xs tabular-nums text-on-surface md:mt-0 md:text-sm">
                      {formatPrice(Number(item.unit_price) * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Popup>
    </li>
  );
}

export function OrdersAdmin({ orders }: OrdersAdminProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("all");
  const [paymentFilter, setPaymentFilter] =
    useState<PaymentStatusFilter>("all");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      if (
        paymentFilter !== "all" &&
        normalizePaymentStatus(order.payment_status) !== paymentFilter
      ) {
        return false;
      }

      return matchesOrderSearch(order, searchQuery);
    });
  }, [orders, searchQuery, statusFilter, paymentFilter]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== "all" ||
    paymentFilter !== "all";

  return (
    <div className="space-y-6">
      <div>
        <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface-variant">
          Admin
        </p>
        <h1 className="font-headline mt-2 text-2xl font-extrabold uppercase leading-tight tracking-tight text-on-surface md:text-3xl">
          Orders
        </h1>
      </div>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-label text-xs font-bold uppercase tracking-[0.15em] text-on-surface">
            All Orders
          </h2>
          <p className="font-body text-xs text-on-surface-variant">
            {filteredOrders.length === orders.length
              ? `${orders.length} order${orders.length === 1 ? "" : "s"}`
              : `${filteredOrders.length} of ${orders.length} order${
                  orders.length === 1 ? "" : "s"
                }`}
          </p>
        </div>

        {orders.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-end gap-3 md:grid md:grid-cols-4">
            <label className="block min-w-0 flex-1 md:col-span-2">
              <span className="mb-2 block font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                Search
              </span>
              <div className="flex items-center gap-2 border border-outline-variant/50 px-3 py-2">
                <SearchIcon
                  className="h-4 w-4 shrink-0 text-on-surface-variant"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by order number, customer, or product..."
                  className="font-body min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
                />
              </div>
            </label>

            <label className="block min-w-48 flex-1">
              <span className="mb-2 block font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                Order status
              </span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as OrderStatusFilter)
                }
                className="font-body w-full border border-outline-variant/50 px-3 py-2 text-sm"
              >
                {STATUS_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block min-w-48 flex-1">
              <span className="mb-2 block font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                Payment status
              </span>
              <select
                value={paymentFilter}
                onChange={(event) =>
                  setPaymentFilter(event.target.value as PaymentStatusFilter)
                }
                className="font-body w-full border border-outline-variant/50 px-3 py-2 text-sm"
              >
                {PAYMENT_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {hasActiveFilters ? (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setPaymentFilter("all");
              }}
              className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:text-on-surface"
            >
              Clear filters
            </button>
          </div>
        ) : null}

        {orders.length === 0 ? (
          <p className="font-body mt-4 text-sm text-on-surface-variant">
            No orders yet.
          </p>
        ) : filteredOrders.length === 0 ? (
          <p className="font-body mt-4 text-sm text-on-surface-variant">
            No orders match your search or filters.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {filteredOrders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
