"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
} from "@/components/admin/AdminUi";
import type { ReportPeriod } from "@/lib/admin-analytics";
import { cn } from "@/lib/utils";

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "day", label: "Daily" },
  { value: "month", label: "Monthly" },
  { value: "year", label: "Yearly" },
];

export function ReportFilters({
  period,
  from,
  to,
}: {
  period: ReportPeriod;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);

  function navigate(params: Record<string, string>) {
    const search = new URLSearchParams(params);
    startTransition(() => router.push(`${pathname}?${search.toString()}`));
  }

  return (
    <div className={cn("flex flex-wrap items-end gap-3", isPending && "opacity-60")}>
      <div>
        <p className={adminLabelClass}>Group by</p>
        <div className="flex">
          {PERIODS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => navigate({ period: option.value })}
              className={cn(
                "font-label border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] -ml-px first:ml-0",
                period === option.value
                  ? "relative border-primary bg-primary text-on-primary"
                  : "border-outline-variant text-on-surface-variant hover:text-on-surface",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ period, from: fromDate, to: toDate });
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <label className="block">
          <span className={adminLabelClass}>From</span>
          <input
            type="date"
            value={fromDate}
            max={toDate}
            onChange={(event) => setFromDate(event.target.value)}
            className={adminInputClass}
          />
        </label>
        <label className="block">
          <span className={adminLabelClass}>To</span>
          <input
            type="date"
            value={toDate}
            min={fromDate}
            onChange={(event) => setToDate(event.target.value)}
            className={adminInputClass}
          />
        </label>
        <button type="submit" className={adminPrimaryButtonClass} disabled={isPending}>
          Apply
        </button>
      </form>
    </div>
  );
}
