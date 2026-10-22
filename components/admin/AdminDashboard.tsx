import Image from "next/image";
import Link from "next/link";
import {
  AdminBadge,
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
  formatAdminDate,
} from "@/components/admin/AdminUi";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { StockAlertList } from "@/components/admin/StockAlertList";
import type { DashboardData } from "@/lib/admin-analytics";
import type { AdminRole } from "@/lib/auth";
import { ORDER_STATUS_LABELS, orderStatusBadgeClass } from "@/lib/order-status";
import { formatPrice } from "@/lib/utils";

export function AdminDashboard({
  data,
  role,
  forbidden,
}: {
  data: DashboardData;
  role: AdminRole;
  forbidden?: boolean;
}) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description="Today's operations at a glance: orders to fulfil, returns to review, and stock that needs attention."
        actions={<AutoRefresh />}
      />

      {forbidden ? (
        <AdminNotice tone="error">
          That page is only available to Super Admins.
        </AdminNotice>
      ) : null}

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <AdminStatCard label="Orders today" value={data.ordersToday} href="/admin/orders" />
        <AdminStatCard
          label="This month"
          value={data.ordersThisMonth}
          hint="orders placed"
        />
        <AdminStatCard
          label="To fulfil"
          value={data.awaitingFulfillment}
          hint="pending + processing"
          tone={data.awaitingFulfillment > 0 ? "warning" : "default"}
          href="/admin/orders?status=processing"
        />
        <AdminStatCard
          label="In transit"
          value={data.shippedInTransit}
          href="/admin/orders?status=shipped"
        />
        <AdminStatCard
          label="Pending returns"
          value={data.pendingReturns}
          tone={data.pendingReturns > 0 ? "warning" : "default"}
          href="/admin/returns"
        />
        <AdminStatCard
          label="Stock alerts"
          value={data.lowStockProducts + data.outOfStockProducts}
          hint={`${data.outOfStockProducts} out · ${data.lowStockProducts} low`}
          tone={data.outOfStockProducts > 0 ? "danger" : data.lowStockProducts > 0 ? "warning" : "default"}
          href="/admin/products?stock=low-stock"
        />
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-5">
        <AdminPanel
          title="Recent orders"
          className="xl:col-span-3"
          actions={
            <Link
              href="/admin/orders"
              className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:text-on-surface"
            >
              All orders →
            </Link>
          }
        >
          {data.recentOrders.length === 0 ? (
            <AdminEmptyState>No orders yet.</AdminEmptyState>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {data.recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex flex-col gap-2 py-3 hover:bg-surface-container-low sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
                  >
                    <div className="min-w-0 sm:flex-1">
                      <p className="font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface">
                        {order.order_number}
                      </p>
                      <p className="font-body mt-1 truncate text-xs text-on-surface-variant">
                        {order.customer_name || "Guest customer"} · {formatAdminDate(order.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 sm:contents">
                      <AdminBadge className={orderStatusBadgeClass(order.status)}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </AdminBadge>
                      <p className="font-body text-sm font-medium tabular-nums text-on-surface sm:w-28 sm:text-right">
                        {formatPrice(Number(order.total))}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <AdminPanel
          title="Stock alerts"
          description="Variants at or below their low-stock threshold."
          className="xl:col-span-2"
        >
          <StockAlertList alerts={data.stockAlerts} limit={8} />
        </AdminPanel>
      </div>

      <AdminPanel
        title="Best-selling products"
        description="All-time units sold across non-cancelled orders."
        actions={
          role === "super_admin" ? (
            <Link
              href="/admin/reports"
              className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:text-on-surface"
            >
              Full report →
            </Link>
          ) : null
        }
      >
        {data.bestSellers.length === 0 ? (
          <AdminEmptyState>No sales recorded yet.</AdminEmptyState>
        ) : (
          <ol className="grid gap-x-8 md:grid-cols-2">
            {data.bestSellers.map((item, index) => (
              <li
                key={item.key}
                className="flex items-center gap-3 border-b border-outline-variant py-3"
              >
                <span className="font-headline w-6 shrink-0 text-sm font-extrabold tabular-nums text-on-surface-variant">
                  {index + 1}
                </span>
                <div className="relative h-10 w-10 shrink-0 overflow-hidden border border-outline-variant bg-surface-container-low">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="40px" className="object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  {item.slug ? (
                    <Link
                      href={`/admin/products?q=${encodeURIComponent(item.slug)}`}
                      className="font-body block truncate text-sm font-medium text-on-surface hover:underline"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <p className="font-body truncate text-sm font-medium text-on-surface">
                      {item.name}
                    </p>
                  )}
                  <p className="font-body text-xs text-on-surface-variant">
                    {item.orders} order{item.orders === 1 ? "" : "s"}
                    <span className="sm:hidden"> · {item.units} sold</span>
                  </p>
                </div>
                <p className="font-body hidden shrink-0 text-sm font-semibold tabular-nums text-on-surface sm:block">
                  {item.units} sold
                </p>
              </li>
            ))}
          </ol>
        )}
      </AdminPanel>
    </div>
  );
}
