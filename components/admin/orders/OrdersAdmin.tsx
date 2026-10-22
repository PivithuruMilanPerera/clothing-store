"use client";

import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AdminBadge,
  AdminPageHeader,
  adminInputClass,
  adminLabelClass,
  formatAdminDate,
} from "@/components/admin/AdminUi";
import { SearchIcon } from "@/components/icons";
import {
  normalizePaymentStatus,
  ORDER_STATUS_LABELS,
  orderStatusBadgeClass,
  PAYMENT_STATUS_LABELS,
  paymentStatusBadgeClass,
} from "@/lib/order-status";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export type OrdersAdminFilters = {
  query?: string;
  status?: OrderStatusFilter;
  payment?: PaymentStatusFilter;
  from?: string;
  to?: string;
  product?: string;
};

type OrdersAdminProps = {
  orders: Order[];
  initialFilters?: OrdersAdminFilters;
};

export type OrderStatusFilter = "all" | OrderStatus;
export type PaymentStatusFilter = "all" | PaymentStatus;

const STATUS_FILTERS: { value: OrderStatusFilter; label: string }[] = [
  { value: "all", label: "All order statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
];

const PAYMENT_FILTERS: { value: PaymentStatusFilter; label: string }[] = [
  { value: "all", label: "All payment statuses" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
];

const ORDERS_PER_PAGE = 25;

const storeDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Colombo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

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
    order.tracking_number,
    order.coupon_code,
    order.user_id,
    itemText,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery));
}

function OrderRow({ order }: { order: Order }) {
  const items = order.order_items ?? [];
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const paymentStatus = normalizePaymentStatus(order.payment_status);

  return (
    <li className="border border-outline-variant bg-surface-container-lowest hover:border-primary">
      <Link href={`/admin/orders/${order.id}`} className="block px-5 py-4 md:px-6">
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
              {formatAdminDate(order.created_at)}
              {order.is_guest ? " · Guest" : ""}
              {order.coupon_code ? ` · Coupon ${order.coupon_code}` : ""}
            </p>
          </div>

          <ChevronRight
            className="mt-1 h-4 w-4 shrink-0 text-on-surface-variant sm:order-3"
            aria-hidden="true"
          />

          <div className="flex w-full justify-end sm:order-2 sm:w-auto">
            <div className="flex flex-col items-end text-right">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <AdminBadge className={orderStatusBadgeClass(order.status)}>
                  {ORDER_STATUS_LABELS[order.status]}
                </AdminBadge>
                <AdminBadge className={paymentStatusBadgeClass(paymentStatus)}>
                  Pay · {PAYMENT_STATUS_LABELS[paymentStatus]}
                </AdminBadge>
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
      </Link>
    </li>
  );
}

export function OrdersAdmin({ orders, initialFilters }: OrdersAdminProps) {
  const [searchQuery, setSearchQuery] = useState(initialFilters?.query ?? "");
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>(
    initialFilters?.status ?? "all",
  );
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatusFilter>(
    initialFilters?.payment ?? "all",
  );
  const [fromDate, setFromDate] = useState(initialFilters?.from ?? "");
  const [toDate, setToDate] = useState(initialFilters?.to ?? "");
  const [productFilter, setProductFilter] = useState(initialFilters?.product ?? "all");
  const [visibleCount, setVisibleCount] = useState(ORDERS_PER_PAGE);

  const productOptions = useMemo(() => {
    const names = new Set<string>();
    for (const order of orders) {
      for (const item of order.order_items ?? []) {
        names.add(item.product_name);
      }
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [orders]);

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

      if (fromDate || toDate) {
        const orderDate = storeDateFormatter.format(new Date(order.created_at));
        if (fromDate && orderDate < fromDate) return false;
        if (toDate && orderDate > toDate) return false;
      }

      if (
        productFilter !== "all" &&
        !(order.order_items ?? []).some((item) => item.product_name === productFilter)
      ) {
        return false;
      }

      return matchesOrderSearch(order, searchQuery);
    });
  }, [orders, searchQuery, statusFilter, paymentFilter, fromDate, toDate, productFilter]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== "all" ||
    paymentFilter !== "all" ||
    Boolean(fromDate) ||
    Boolean(toDate) ||
    productFilter !== "all";

  const filteredTotal = filteredOrders.reduce(
    (sum, order) => sum + Number(order.total),
    0,
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Orders" />

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
                } · ${formatPrice(filteredTotal)}`}
          </p>
        </div>

        {orders.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <label className="block sm:col-span-2 lg:col-span-3">
              <span className={adminLabelClass}>Search</span>
              <div className="flex items-center gap-2 border border-outline-variant/50 px-3 py-2">
                <SearchIcon
                  className="h-4 w-4 shrink-0 text-on-surface-variant"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Order number, customer name, email, phone..."
                  className="font-body min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
                />
              </div>
            </label>

            <label className="block lg:col-span-3">
              <span className={adminLabelClass}>Product</span>
              <select
                value={productFilter}
                onChange={(event) => setProductFilter(event.target.value)}
                className={adminInputClass}
              >
                <option value="all">All products</option>
                {productOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block lg:col-span-2">
              <span className={adminLabelClass}>Order status</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as OrderStatusFilter)
                }
                className={adminInputClass}
              >
                {STATUS_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block lg:col-span-2">
              <span className={adminLabelClass}>Payment status</span>
              <select
                value={paymentFilter}
                onChange={(event) =>
                  setPaymentFilter(event.target.value as PaymentStatusFilter)
                }
                className={adminInputClass}
              >
                {PAYMENT_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={adminLabelClass}>From</span>
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(event) => setFromDate(event.target.value)}
                className={adminInputClass}
              />
            </label>

            <label className="block">
              <span className={adminLabelClass}>To</span>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                className={adminInputClass}
              />
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
                setFromDate("");
                setToDate("");
                setProductFilter("all");
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
          <>
            <ul className="mt-6 space-y-4">
              {filteredOrders.slice(0, visibleCount).map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </ul>
            {filteredOrders.length > visibleCount ? (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((count) => count + ORDERS_PER_PAGE)}
                  className="font-label border border-outline-variant px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-on-surface hover:bg-surface-container-low"
                >
                  Show more ({filteredOrders.length - visibleCount} remaining)
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
