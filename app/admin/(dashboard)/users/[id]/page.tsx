import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AdminBadge,
  AdminEmptyState,
  AdminPanel,
  AdminStatCard,
  formatAdminDate,
} from "@/components/admin/AdminUi";
import { ORDER_STATUS_LABELS, orderStatusBadgeClass } from "@/lib/order-status";
import type { ReturnStatus } from "@/lib/types";
import { getCustomerProfileForAdmin } from "@/lib/users";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Customer | Admin | VELVORZ",
};

const RETURN_BADGE: Record<ReturnStatus, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  approved: "border-primary/30 bg-primary/10 text-primary",
  rejected: "border-error/30 bg-error/10 text-error",
  completed: "border-green-600/30 bg-green-600/10 text-green-700",
};

export default async function AdminCustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerProfileForAdmin(id);

  if (!customer) {
    notFound();
  }

  const productTotals = new Map<string, { name: string; units: number; spent: number }>();
  for (const order of customer.orders) {
    if (order.status === "cancelled") continue;
    for (const item of order.order_items ?? []) {
      const entry = productTotals.get(item.product_name) ?? {
        name: item.product_name,
        units: 0,
        spent: 0,
      };
      entry.units += item.quantity;
      entry.spent += Number(item.unit_price) * item.quantity;
      productTotals.set(item.product_name, entry);
    }
  }
  const favouriteProducts = [...productTotals.values()]
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:text-on-surface"
        >
          ← All customers
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-headline text-2xl font-extrabold uppercase leading-tight tracking-tight text-on-surface md:text-3xl">
            {customer.full_name}
          </h1>
          <AdminBadge>{customer.kind === "guest" ? "Guest" : "Registered"}</AdminBadge>
        </div>
        <p className="font-body mt-2 text-sm text-on-surface-variant">
          {customer.email}
          {customer.phone ? ` · ${customer.phone}` : ""}
          {customer.created_at
            ? ` · ${customer.kind === "guest" ? "First order" : "Joined"} ${formatAdminDate(customer.created_at, false)}`
            : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4 md:gap-4">
        <AdminStatCard label="Orders" value={customer.stats.orderCount} />
        <AdminStatCard
          label="Total spent"
          value={formatPrice(customer.stats.totalSpent, { decimals: 0 })}
          hint="excl. cancelled & returned"
        />
        <AdminStatCard
          label="Average order"
          value={formatPrice(customer.stats.averageOrderValue, { decimals: 0 })}
        />
        <AdminStatCard
          label="Last order"
          value={
            <span className="text-base md:text-lg">
              {formatAdminDate(customer.stats.lastOrderAt, false)}
            </span>
          }
          hint={`${customer.stats.itemsPurchased} items purchased`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <AdminPanel
          title="Purchase history"
          className="lg:col-span-2"
          actions={
            customer.email ? (
              <Link
                href={`/admin/orders?q=${encodeURIComponent(customer.email)}`}
                className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:text-on-surface"
              >
                Filter in orders →
              </Link>
            ) : null
          }
        >
          {customer.orders.length === 0 ? (
            <AdminEmptyState>This customer has not placed any orders yet.</AdminEmptyState>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {customer.orders.map((order) => {
                const items = order.order_items ?? [];
                return (
                  <li key={order.id}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex flex-col gap-2 py-3 hover:bg-surface-container-low sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
                    >
                      <div className="min-w-0 sm:flex-1">
                        <p className="font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface">
                          {order.order_number}
                        </p>
                        <p className="font-body mt-1 line-clamp-2 text-xs text-on-surface-variant sm:truncate">
                          {formatAdminDate(order.created_at)} ·{" "}
                          {items
                            .map((item) => `${item.product_name}${item.quantity > 1 ? ` ×${item.quantity}` : ""}`)
                            .join(", ") || "No items"}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 sm:contents">
                        <AdminBadge className={orderStatusBadgeClass(order.status)}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </AdminBadge>
                        <p className="font-body text-sm font-medium tabular-nums sm:w-28 sm:text-right">
                          {formatPrice(Number(order.total))}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminPanel>

        <div className="space-y-6">
          <AdminPanel title="Most purchased">
            {favouriteProducts.length === 0 ? (
              <AdminEmptyState>No purchases yet.</AdminEmptyState>
            ) : (
              <ul className="space-y-3">
                {favouriteProducts.map((product) => (
                  <li key={product.name} className="flex justify-between gap-3 text-sm">
                    <span className="font-body truncate text-on-surface">{product.name}</span>
                    <span className="font-body shrink-0 tabular-nums text-on-surface-variant">
                      {product.units} · {formatPrice(product.spent, { decimals: 0 })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </AdminPanel>

          <AdminPanel
            title="Return requests"
            actions={
              customer.returns.length ? (
                <Link
                  href="/admin/returns"
                  className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:text-on-surface"
                >
                  Manage →
                </Link>
              ) : null
            }
          >
            {customer.returns.length === 0 ? (
              <AdminEmptyState>No return requests.</AdminEmptyState>
            ) : (
              <ul className="space-y-3">
                {customer.returns.map((request) => (
                  <li key={request.id} className="text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-label text-xs font-bold uppercase tracking-[0.1em]">
                        {request.orders?.order_number ?? "Order"}
                      </span>
                      <AdminBadge className={RETURN_BADGE[request.status]}>
                        {request.status}
                      </AdminBadge>
                    </div>
                    <p className="font-body mt-1 text-xs text-on-surface-variant">
                      {request.reason} · {formatAdminDate(request.created_at, false)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </AdminPanel>

          <AdminPanel title="Saved addresses">
            {customer.addresses.length === 0 ? (
              <AdminEmptyState>No saved addresses.</AdminEmptyState>
            ) : (
              <ul className="space-y-4">
                {customer.addresses.map((address) => (
                  <li key={address.id} className="font-body text-sm text-on-surface">
                    <p className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                      {address.label}
                      {address.is_default ? " · Default" : ""}
                    </p>
                    <p className="mt-1">{address.full_name}</p>
                    <p>{[address.line1, address.line2].filter(Boolean).join(", ")}</p>
                    <p>
                      {[address.city, address.state, address.postal_code].filter(Boolean).join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
