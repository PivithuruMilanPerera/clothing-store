import Image from "next/image";
import Link from "next/link";
import { AdminBadge, AdminEmptyState } from "@/components/admin/AdminUi";
import type { StockAlert } from "@/lib/admin-analytics";

export function StockAlertList({
  alerts,
  limit,
}: {
  alerts: StockAlert[];
  limit?: number;
}) {
  const visible = limit ? alerts.slice(0, limit) : alerts;

  if (alerts.length === 0) {
    return <AdminEmptyState>All products are above their low-stock thresholds.</AdminEmptyState>;
  }

  return (
    <ul className="divide-y divide-outline-variant">
      {visible.map((alert) => (
        <li key={`${alert.productId}:${alert.variantLabel ?? ""}`}>
          <Link
            href={`/admin/products?q=${encodeURIComponent(alert.slug)}`}
            className="flex items-center gap-3 py-3 hover:bg-surface-container-low"
          >
            <div className="relative h-10 w-10 shrink-0 overflow-hidden border border-outline-variant bg-surface-container-low">
              {alert.image ? (
                <Image
                  src={alert.image}
                  alt={alert.productName}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-body truncate text-sm font-medium text-on-surface">
                {alert.productName}
              </p>
              <p className="font-body truncate text-xs text-on-surface-variant">
                {alert.variantLabel ?? "All variants"} · threshold {alert.threshold}
                {alert.isPublished ? "" : " · unpublished"}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <AdminBadge
                className={
                  alert.state === "out"
                    ? "border-error/30 bg-error/10 text-error"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-700"
                }
              >
                {alert.state === "out" ? "Out of stock" : "Low stock"}
              </AdminBadge>
              <span className="font-body text-xs tabular-nums text-on-surface-variant">
                {alert.inventory} left
              </span>
            </div>
          </Link>
        </li>
      ))}
      {limit && alerts.length > limit ? (
        <li className="pt-3">
          <Link
            href="/admin/products?stock=low-stock"
            className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:text-on-surface"
          >
            View all {alerts.length} alerts →
          </Link>
        </li>
      ) : null}
    </ul>
  );
}
