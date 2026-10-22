import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AdminBadge,
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
  formatAdminDate,
} from "@/components/admin/AdminUi";
import { StockAlertList } from "@/components/admin/StockAlertList";
import { ReportFilters } from "@/components/admin/reports/ReportFilters";
import { RevenueChart, Sparkline } from "@/components/admin/reports/RevenueChart";
import { getReportsData } from "@/lib/admin-analytics";
import { requireSuperAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Reports | Super Admin | VELVORZ",
  description: "Revenue, best sellers and top customers.",
};

type SearchParams = Promise<{ period?: string; from?: string; to?: string }>;

function money(value: number) {
  return formatPrice(value, { decimals: 0 });
}

function changeHint(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? "No revenue in previous period" : undefined;
  const change = ((current - previous) / previous) * 100;
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}% vs previous period (${money(previous)})`;
}

export default async function AdminReportsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireSuperAdmin();
  const params = await searchParams;
  const report = await getReportsData(params);
  const { totals } = report;
  const outCount = report.stockAlerts.filter((alert) => alert.state === "out").length;
  const lowCount = report.stockAlerts.length - outCount;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Super admin"
        title="Revenue & performance"
        description={`Gross income from ${formatAdminDate(`${report.from}T12:00:00+05:30`, false)} to ${formatAdminDate(`${report.to}T12:00:00+05:30`, false)}. Cancelled orders and failed payments are excluded.`}
      />

      <ReportFilters period={report.period} from={report.from} to={report.to} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Gross revenue"
          value={money(totals.gross)}
          hint={changeHint(totals.gross, report.previousGross)}
        />
        <AdminStatCard
          label="Net revenue"
          value={money(totals.net)}
          hint={`${money(totals.returned)} returned · ${money(totals.discount)} discounts`}
          tone="success"
        />
        <AdminStatCard
          label="Orders"
          value={totals.orders}
          hint={`${totals.unitsSold} units · ${totals.cancelledOrders} cancelled`}
        />
        <AdminStatCard
          label="Average order"
          value={money(totals.averageOrderValue)}
          hint={`${money(totals.collected)} payment collected`}
        />
      </div>

      <AdminPanel
        title={
          report.period === "day"
            ? "Daily revenue"
            : report.period === "month"
              ? "Monthly revenue"
              : "Yearly revenue"
        }
        description="Gross income per period. Hover a bar for details."
      >
        <RevenueChart buckets={report.buckets} />
      </AdminPanel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <AdminPanel
          title="Most sold items"
          description="Units sold in the selected range, with all-time totals and the trend per period."
        >
          {report.mostSold.length === 0 ? (
            <AdminEmptyState>No sales in this period.</AdminEmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="font-label border-b border-outline-variant text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                    <th className="pb-2 pr-3">#</th>
                    <th className="pb-2 pr-3">Product</th>
                    <th className="pb-2 pr-3 text-right">Units</th>
                    <th className="pb-2 pr-3 text-right">Revenue</th>
                    <th className="pb-2 pr-3 text-right">All-time</th>
                    <th className="pb-2">Trend</th>
                  </tr>
                </thead>
                <tbody className="font-body text-sm">
                  {report.mostSold.map((item, index) => (
                    <tr key={item.key} className="border-b border-outline-variant/50">
                      <td className="py-2.5 pr-3 tabular-nums text-on-surface-variant">{index + 1}</td>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden border border-outline-variant bg-surface-container-low">
                            {item.image ? (
                              <Image src={item.image} alt={item.name} fill sizes="36px" className="object-cover" />
                            ) : null}
                          </div>
                          {item.slug ? (
                            <Link
                              href={`/admin/products?q=${encodeURIComponent(item.slug)}`}
                              className="font-medium text-on-surface hover:underline"
                            >
                              {item.name}
                            </Link>
                          ) : (
                            <span className="font-medium text-on-surface">{item.name}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums font-semibold">{item.units}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{money(item.revenue)}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-on-surface-variant">
                        {item.allTimeUnits}
                      </td>
                      <td className="py-2.5">
                        <Sparkline values={item.trend} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminPanel>

        <AdminPanel title="Top 10 customers" description="Highest total spend in the selected range.">
          {report.topCustomers.length === 0 ? (
            <AdminEmptyState>No customer orders in this period.</AdminEmptyState>
          ) : (
            <ol className="divide-y divide-outline-variant">
              {report.topCustomers.map((customer, index) => (
                <li key={customer.key}>
                  <Link
                    href={`/admin/users/${encodeURIComponent(customer.key)}`}
                    className="flex items-center gap-3 py-3 hover:bg-surface-container-low"
                  >
                    <span className="font-headline w-6 text-lg font-extrabold tabular-nums text-on-surface-variant">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-body flex items-center gap-2 truncate text-sm font-medium text-on-surface">
                        {customer.name}
                        {customer.isGuest ? <AdminBadge>Guest</AdminBadge> : null}
                      </p>
                      <p className="font-body truncate text-xs text-on-surface-variant">
                        {customer.email} · {customer.orders} order{customer.orders === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span className="font-body text-sm font-semibold tabular-nums text-on-surface">
                      {money(customer.totalSpent)}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </AdminPanel>
      </div>

      <AdminPanel
        title="Low stock across catalog"
        description={`${outCount} out of stock · ${lowCount} low stock, using each product's threshold.`}
        actions={
          <Link
            href="/admin/settings/stock"
            className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:text-on-surface"
          >
            Thresholds →
          </Link>
        }
      >
        <StockAlertList alerts={report.stockAlerts} />
      </AdminPanel>
    </div>
  );
}
