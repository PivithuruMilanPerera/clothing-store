import type { RevenueBucket } from "@/lib/admin-analytics";
import { formatPrice } from "@/lib/utils";

/** Dependency-free bar chart; bars scale to the largest bucket in range. */
export function RevenueChart({ buckets }: { buckets: RevenueBucket[] }) {
  const max = Math.max(1, ...buckets.map((bucket) => bucket.gross));
  const labelEvery = Math.max(1, Math.ceil(buckets.length / 12));

  if (buckets.every((bucket) => bucket.gross === 0)) {
    return (
      <p className="font-body py-16 text-center text-sm text-on-surface-variant">
        No revenue in this period.
      </p>
    );
  }

  return (
    <div>
      <div className="flex h-56 items-end gap-[2px] border-b border-outline-variant">
        {buckets.map((bucket) => (
          <div key={bucket.key} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full bg-primary/80 transition-colors group-hover:bg-primary"
              style={{ height: `${(bucket.gross / max) * 100}%`, minHeight: bucket.gross > 0 ? 2 : 0 }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max -translate-x-1/2 border border-outline-variant bg-surface-container-lowest px-3 py-2 shadow-md group-hover:block">
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                {bucket.label}
              </p>
              <p className="font-body mt-1 text-sm font-semibold tabular-nums text-on-surface">
                {formatPrice(bucket.gross, { decimals: 0 })}
              </p>
              <p className="font-body text-xs text-on-surface-variant">
                {bucket.orders} order{bucket.orders === 1 ? "" : "s"}
                {bucket.returned > 0
                  ? ` · ${formatPrice(bucket.returned, { decimals: 0 })} returned`
                  : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-[2px]">
        {buckets.map((bucket, index) => (
          <span
            key={bucket.key}
            className="font-body flex-1 truncate text-center text-[10px] text-on-surface-variant"
          >
            {index % labelEvery === 0 ? bucket.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-6 w-24 items-end gap-px" aria-hidden="true">
      {values.map((value, index) => (
        <span
          key={index}
          className="flex-1 bg-primary/60"
          style={{ height: `${(value / max) * 100}%`, minHeight: value > 0 ? 2 : 0 }}
        />
      ))}
    </div>
  );
}
