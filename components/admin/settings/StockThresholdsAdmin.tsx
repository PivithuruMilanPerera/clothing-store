"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { saveLowStockThresholdsAction } from "@/app/admin/(dashboard)/settings/stock/actions";
import {
  AdminBadge,
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
} from "@/components/admin/AdminUi";
import { cn } from "@/lib/utils";

export type StockThresholdRow = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  isPublished: boolean;
  totalInventory: number;
  lowestVariantInventory: number;
  threshold: number | null;
  state: "ok" | "low" | "out";
};

type StateFilter = "all" | "low" | "out" | "custom";

const STATE_BADGE = {
  ok: "border-green-600/30 bg-green-600/10 text-green-700",
  low: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  out: "border-error/30 bg-error/10 text-error",
};

const STATE_LABEL = { ok: "In stock", low: "Low stock", out: "Out of stock" };

export function StockThresholdsAdmin({
  rows,
  defaultThreshold,
}: {
  rows: StockThresholdRow[];
  defaultThreshold: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StateFilter>("all");
  const [bulkValue, setBulkValue] = useState("");
  const [feedback, setFeedback] = useState<{ tone: "error" | "success"; text: string } | null>(
    null,
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter === "low" && row.state !== "low") return false;
      if (filter === "out" && row.state !== "out") return false;
      if (filter === "custom" && row.threshold === null) return false;
      return !q || row.name.toLowerCase().includes(q) || row.slug.includes(q);
    });
  }, [rows, query, filter]);

  const dirtyIds = Object.keys(drafts).filter((id) => {
    const row = rows.find((item) => item.id === id);
    const original = row?.threshold === null || row?.threshold === undefined ? "" : String(row.threshold);
    return drafts[id]!.trim() !== original;
  });

  function valueFor(row: StockThresholdRow) {
    return drafts[row.id] ?? (row.threshold === null ? "" : String(row.threshold));
  }

  function handleSave() {
    const updates = dirtyIds.map((productId) => {
      const raw = drafts[productId]!.trim();
      return { productId, threshold: raw === "" ? null : Number(raw) };
    });

    setFeedback(null);
    startTransition(async () => {
      const result = await saveLowStockThresholdsAction(updates);
      if (!result.success) {
        setFeedback({ tone: "error", text: result.error || "Unable to save thresholds." });
        return;
      }
      setDrafts({});
      setFeedback({
        tone: "success",
        text: `Saved thresholds for ${result.saved} product${result.saved === 1 ? "" : "s"}.`,
      });
      router.refresh();
    });
  }

  function applyBulk() {
    setDrafts((current) => {
      const next = { ...current };
      for (const row of visible) next[row.id] = bulkValue.trim();
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Platform settings"
        title="Low-stock thresholds"
        description={`Each variant at or below its product’s threshold is flagged as low stock on the dashboard, in admin alerts and emails, and on the storefront. Leave blank to use the default of ${defaultThreshold}.`}
        actions={
          <button
            type="button"
            disabled={isPending || dirtyIds.length === 0}
            onClick={handleSave}
            className={adminPrimaryButtonClass}
          >
            {isPending
              ? "Saving..."
              : dirtyIds.length
                ? `Save ${dirtyIds.length} change${dirtyIds.length === 1 ? "" : "s"}`
                : "Save changes"}
          </button>
        }
      />

      {feedback ? <AdminNotice tone={feedback.tone}>{feedback.text}</AdminNotice> : null}

      <AdminPanel>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block min-w-56 flex-1">
            <span className={adminLabelClass}>Search products</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name or slug"
              className={adminInputClass}
            />
          </label>
          <div className="flex gap-1">
            {(
              [
                ["all", "All"],
                ["low", "Low"],
                ["out", "Out"],
                ["custom", "Custom threshold"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  "font-label border px-2.5 py-2 text-[10px] font-bold uppercase tracking-[0.12em]",
                  filter === value
                    ? "border-primary bg-primary text-on-primary"
                    : "border-outline-variant text-on-surface-variant",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <label className="block">
              <span className={adminLabelClass}>Set for {visible.length} shown</span>
              <input
                type="number"
                min="0"
                step="1"
                value={bulkValue}
                onChange={(event) => setBulkValue(event.target.value)}
                placeholder={`Default (${defaultThreshold})`}
                className={`${adminInputClass} w-36`}
              />
            </label>
            <button type="button" onClick={applyBulk} className={adminSecondaryButtonClass}>
              Apply
            </button>
          </div>
        </div>

        {visible.length === 0 ? (
          <AdminEmptyState>No products match.</AdminEmptyState>
        ) : (
          <ul className="mt-5 divide-y divide-outline-variant border-t border-outline-variant">
            {visible.map((row) => {
              const isDirty = dirtyIds.includes(row.id);
              return (
                <li key={row.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden border border-outline-variant bg-surface-container-low">
                    {row.image ? (
                      <Image src={row.image} alt={row.name} fill sizes="40px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-40 flex-1">
                    <Link
                      href={`/admin/products?q=${encodeURIComponent(row.slug)}`}
                      className="font-body text-sm font-medium text-on-surface hover:underline"
                    >
                      {row.name}
                    </Link>
                    <p className="font-body text-xs text-on-surface-variant">
                      {row.totalInventory} in stock · lowest variant {row.lowestVariantInventory}
                      {row.isPublished ? "" : " · unpublished"}
                    </p>
                  </div>
                  <AdminBadge className={STATE_BADGE[row.state]}>{STATE_LABEL[row.state]}</AdminBadge>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    aria-label={`Low-stock threshold for ${row.name}`}
                    value={valueFor(row)}
                    onChange={(event) =>
                      setDrafts((current) => ({ ...current, [row.id]: event.target.value }))
                    }
                    placeholder={`Default (${defaultThreshold})`}
                    className={cn(adminInputClass, "w-36", isDirty && "border-primary")}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}
