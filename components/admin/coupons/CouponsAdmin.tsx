"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import {
  deleteCoupon,
  saveCoupon,
  setCouponActive,
} from "@/app/admin/(dashboard)/coupons/actions";
import {
  AdminBadge,
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  AdminStatCard,
  adminDangerButtonClass,
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
  formatAdminDate,
} from "@/components/admin/AdminUi";
import { Popup } from "@/components/ui";
import type { CouponWithUsage } from "@/lib/coupon-admin";
import {
  COUPON_STATUS_LABELS,
  describeCoupon,
  getCouponStatus,
  type CouponStatus,
} from "@/lib/coupons";
import { cn, formatPrice } from "@/lib/utils";

const STATUS_BADGE: Record<CouponStatus, string> = {
  active: "border-green-600/30 bg-green-600/10 text-green-700",
  inactive: "border-outline-variant bg-surface-container-low text-on-surface-variant",
  scheduled: "border-primary/30 bg-primary/10 text-primary",
  expired: "border-error/30 bg-error/10 text-error",
  exhausted: "border-amber-500/30 bg-amber-500/10 text-amber-700",
};

const localDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Colombo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function toLocalInputValue(iso: string | null) {
  if (!iso) return "";
  const parts = Object.fromEntries(
    localDateTimeFormatter.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function CouponForm({
  coupon,
  onDone,
}: {
  coupon: CouponWithUsage | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(saveCoupon, null);
  const [discountType, setDiscountType] = useState(coupon?.discount_type ?? "percentage");

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      onDone();
    }
  }, [state?.success, router, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      {coupon ? <input type="hidden" name="id" value={coupon.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={adminLabelClass}>Code *</span>
          <input
            name="code"
            required
            defaultValue={coupon?.code ?? ""}
            readOnly={Boolean(coupon)}
            placeholder="WELCOME10"
            className={cn(adminInputClass, "uppercase", coupon && "bg-surface-container-low")}
          />
          {coupon ? (
            <span className="font-body mt-1 block text-[11px] text-on-surface-variant">
              Codes can’t be changed after creation so usage history stays accurate.
            </span>
          ) : null}
        </label>
        <label className="block">
          <span className={adminLabelClass}>Description</span>
          <input
            name="description"
            defaultValue={coupon?.description ?? ""}
            placeholder="New customer welcome offer"
            className={adminInputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className={adminLabelClass}>Discount type</span>
          <select
            name="discount_type"
            value={discountType}
            onChange={(event) =>
              setDiscountType(event.target.value === "fixed" ? "fixed" : "percentage")
            }
            className={adminInputClass}
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed amount (Rs.)</option>
          </select>
        </label>
        <label className="block">
          <span className={adminLabelClass}>
            {discountType === "percentage" ? "Percent off *" : "Amount off (Rs.) *"}
          </span>
          <input
            name="discount_value"
            type="number"
            min="0.01"
            step="0.01"
            max={discountType === "percentage" ? 100 : undefined}
            required
            defaultValue={coupon?.discount_value ?? ""}
            className={adminInputClass}
          />
        </label>
        <label className="block">
          <span className={adminLabelClass}>Max discount (Rs.)</span>
          <input
            name="max_discount_amount"
            type="number"
            min="1"
            step="0.01"
            disabled={discountType !== "percentage"}
            defaultValue={coupon?.max_discount_amount ?? ""}
            placeholder="No cap"
            className={adminInputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={adminLabelClass}>Minimum order (Rs.)</span>
          <input
            name="min_order_amount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={coupon?.min_order_amount ?? 0}
            className={adminInputClass}
          />
        </label>
        <label className="block">
          <span className={adminLabelClass}>Usage limit</span>
          <input
            name="usage_limit"
            type="number"
            min="1"
            step="1"
            defaultValue={coupon?.usage_limit ?? ""}
            placeholder="Unlimited"
            className={adminInputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={adminLabelClass}>Starts (Sri Lanka time)</span>
          <input
            name="starts_at"
            type="datetime-local"
            defaultValue={toLocalInputValue(coupon?.starts_at ?? null)}
            className={adminInputClass}
          />
        </label>
        <label className="block">
          <span className={adminLabelClass}>Expires (Sri Lanka time)</span>
          <input
            name="expires_at"
            type="datetime-local"
            defaultValue={toLocalInputValue(coupon?.expires_at ?? null)}
            className={adminInputClass}
          />
        </label>
      </div>

      <label className="flex items-center gap-2">
        <input type="checkbox" name="is_active" defaultChecked={coupon?.is_active ?? true} />
        <span className="font-body text-sm text-on-surface">Active</span>
      </label>

      {state?.error ? <AdminNotice tone="error">{state.error}</AdminNotice> : null}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className={adminSecondaryButtonClass}>
          Cancel
        </button>
        <button type="submit" disabled={isPending} className={adminPrimaryButtonClass}>
          {isPending ? "Saving..." : coupon ? "Save changes" : "Create coupon"}
        </button>
      </div>
    </form>
  );
}

function CouponRow({
  coupon,
  onEdit,
}: {
  coupon: CouponWithUsage;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = getCouponStatus(coupon);
  const usagePercent =
    coupon.usage_limit !== null
      ? Math.min(100, (coupon.used_count / coupon.usage_limit) * 100)
      : null;

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.error || "Action failed.");
        return;
      }
      setConfirmDelete(false);
      router.refresh();
    });
  }

  return (
    <li className="border border-outline-variant bg-surface-container-lowest p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-headline text-lg font-extrabold uppercase tracking-wide text-on-surface">
              {coupon.code}
            </p>
            <AdminBadge className={STATUS_BADGE[status]}>{COUPON_STATUS_LABELS[status]}</AdminBadge>
          </div>
          <p className="font-body mt-1 text-sm text-on-surface">
            {describeCoupon(coupon)}
            {coupon.min_order_amount > 0
              ? ` · min order ${formatPrice(coupon.min_order_amount, { decimals: 0 })}`
              : ""}
          </p>
          {coupon.description ? (
            <p className="font-body mt-1 text-xs text-on-surface-variant">{coupon.description}</p>
          ) : null}
          <p className="font-body mt-1 text-xs text-on-surface-variant">
            {coupon.starts_at ? `From ${formatAdminDate(coupon.starts_at)} · ` : ""}
            {coupon.expires_at ? `Expires ${formatAdminDate(coupon.expires_at)}` : "No expiry"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onEdit} disabled={isPending} className={adminSecondaryButtonClass}>
            Edit
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => run(() => setCouponActive(coupon.id, !coupon.is_active))}
            className={coupon.is_active ? adminDangerButtonClass : adminPrimaryButtonClass}
          >
            {coupon.is_active ? "Deactivate" : "Activate"}
          </button>
          {confirmDelete ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(() => deleteCoupon(coupon.id))}
              className={adminDangerButtonClass}
            >
              Confirm delete
            </button>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={() => setConfirmDelete(true)}
              className="font-label px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:text-error"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-outline-variant pt-4 sm:grid-cols-4">
        <div>
          <dt className={adminLabelClass}>Redemptions</dt>
          <dd className="font-body text-sm tabular-nums text-on-surface">
            {coupon.used_count}
            {coupon.usage_limit !== null ? ` / ${coupon.usage_limit}` : ""}
          </dd>
          {usagePercent !== null ? (
            <div className="mt-1.5 h-1.5 w-full bg-surface-container-low">
              <div className="h-full bg-primary" style={{ width: `${usagePercent}%` }} />
            </div>
          ) : null}
        </div>
        <div>
          <dt className={adminLabelClass}>Order revenue</dt>
          <dd className="font-body text-sm tabular-nums text-on-surface">
            {formatPrice(coupon.usage.revenue, { decimals: 0 })}
          </dd>
        </div>
        <div>
          <dt className={adminLabelClass}>Discount given</dt>
          <dd className="font-body text-sm tabular-nums text-on-surface">
            {formatPrice(coupon.usage.discountGiven, { decimals: 0 })}
          </dd>
        </div>
        <div>
          <dt className={adminLabelClass}>Last used</dt>
          <dd className="font-body text-sm text-on-surface">
            {coupon.usage.lastUsedAt ? formatAdminDate(coupon.usage.lastUsedAt, false) : "Never"}
          </dd>
        </div>
      </dl>
      {error ? <p className="font-body mt-3 text-xs text-error">{error}</p> : null}
    </li>
  );
}

export function CouponsAdmin({
  coupons,
  tableMissing,
}: {
  coupons: CouponWithUsage[];
  tableMissing: boolean;
}) {
  const [editing, setEditing] = useState<CouponWithUsage | "new" | null>(null);
  const [showInactive, setShowInactive] = useState(true);

  const activeCount = coupons.filter((coupon) => getCouponStatus(coupon) === "active").length;
  const totalRedemptions = coupons.reduce((sum, coupon) => sum + coupon.usage.orders, 0);
  const totalDiscount = coupons.reduce((sum, coupon) => sum + coupon.usage.discountGiven, 0);
  const visible = showInactive
    ? coupons
    : coupons.filter((coupon) => getCouponStatus(coupon) === "active");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Coupons"
        description="Create discount codes customers can apply at checkout, deactivate them at any time, and track how they perform."
        actions={
          tableMissing ? null : (
            <button type="button" onClick={() => setEditing("new")} className={adminPrimaryButtonClass}>
              New coupon
            </button>
          )
        }
      />

      {tableMissing ? (
        <AdminNotice>
          The coupons table doesn’t exist yet. Run{" "}
          <code>supabase/milestone-4-admin-migration.sql</code> in the Supabase SQL editor.
        </AdminNotice>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <AdminStatCard label="Coupons" value={coupons.length} />
        <AdminStatCard label="Active now" value={activeCount} tone="success" />
        <AdminStatCard label="Orders with coupons" value={totalRedemptions} />
        <AdminStatCard
          label="Total discount given"
          value={formatPrice(totalDiscount, { decimals: 0 })}
        />
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={showInactive}
          onChange={(event) => setShowInactive(event.target.checked)}
        />
        <span className="font-body text-sm text-on-surface-variant">
          Show deactivated, expired and used-up coupons
        </span>
      </label>

      {visible.length === 0 ? (
        <AdminEmptyState>
          {coupons.length === 0 ? "No coupons yet." : "No active coupons."}
        </AdminEmptyState>
      ) : (
        <ul className="space-y-4">
          {visible.map((coupon) => (
            <CouponRow key={coupon.id} coupon={coupon} onEdit={() => setEditing(coupon)} />
          ))}
        </ul>
      )}

      <Popup
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New coupon" : `Edit ${editing ? editing.code : ""}`}
        size="md"
      >
        {editing !== null ? (
          <CouponForm
            key={editing === "new" ? "new" : editing.id}
            coupon={editing === "new" ? null : editing}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Popup>
    </div>
  );
}
