"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { setReturnStatusAction } from "@/app/admin/(dashboard)/returns/actions";
import {
  AdminBadge,
  AdminEmptyState,
  AdminPageHeader,
  adminDangerButtonClass,
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
  formatAdminDate,
} from "@/components/admin/AdminUi";
import type { AdminReturnRequest } from "@/lib/returns";
import { ORDER_STATUS_LABELS, orderStatusBadgeClass } from "@/lib/order-status";
import type { ReturnStatus } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

const RETURN_BADGE: Record<ReturnStatus, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  approved: "border-primary/30 bg-primary/10 text-primary",
  rejected: "border-error/30 bg-error/10 text-error",
  completed: "border-green-600/30 bg-green-600/10 text-green-700",
};

type Filter = "all" | ReturnStatus;

function ReturnCard({ request }: { request: AdminReturnRequest }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState(request.admin_note ?? "");
  const [error, setError] = useState<string | null>(null);

  function update(status: ReturnStatus) {
    setError(null);
    startTransition(async () => {
      const result = await setReturnStatusAction(request.id, status, note);
      if (!result.success) {
        setError(result.error || "Unable to update this return request.");
        return;
      }
      router.refresh();
    });
  }

  const order = request.order;
  const canDecide = request.status === "pending" || request.status === "rejected";

  return (
    <li className="border border-outline-variant bg-surface-container-lowest p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <AdminBadge className={RETURN_BADGE[request.status]}>
              {RETURN_STATUS_LABELS[request.status]}
            </AdminBadge>
            {order ? (
              <Link
                href={`/admin/orders/${order.id}`}
                className="font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface hover:underline"
              >
                Order {order.order_number}
              </Link>
            ) : null}
          </div>
          <p className="font-body mt-2 text-sm text-on-surface">
            {order?.customer_name || "Customer"}
            {order?.customer_email ? ` · ${order.customer_email}` : ""}
          </p>
          <p className="font-body mt-1 text-xs text-on-surface-variant">
            Requested {formatAdminDate(request.created_at)}
            {request.resolved_at ? ` · Resolved ${formatAdminDate(request.resolved_at)}` : ""}
          </p>
        </div>
        {order ? (
          <div className="text-right">
            <AdminBadge className={orderStatusBadgeClass(order.status)}>
              {ORDER_STATUS_LABELS[order.status]}
            </AdminBadge>
            <p className="font-body mt-2 text-sm font-medium tabular-nums">
              {formatPrice(order.total)}
            </p>
            <p className="font-body text-xs text-on-surface-variant">
              {order.item_count} item{order.item_count === 1 ? "" : "s"}
            </p>
          </div>
        ) : null}
      </div>

      {request.item ? (
        <div className="mt-4 flex items-center gap-3 border-t border-outline-variant pt-4">
          <span className="relative block h-16 w-12 shrink-0 overflow-hidden bg-surface-container-low">
            {request.item.image ? (
              <Image
                src={request.item.image}
                alt={request.item.product_name}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : null}
          </span>
          <div className="min-w-0">
            <p className={adminLabelClass}>Item</p>
            <p className="font-body text-sm text-on-surface">{request.item.product_name}</p>
            <p className="font-body text-xs text-on-surface-variant">
              {[request.item.color, request.item.size].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-4 border-t border-outline-variant pt-4">
        <p className={adminLabelClass}>Reason</p>
        <p className="font-body text-sm text-on-surface">{request.reason}</p>
        {request.details ? (
          <p className="font-body mt-2 whitespace-pre-line text-sm text-on-surface-variant">
            {request.details}
          </p>
        ) : null}
      </div>

      {request.status !== "completed" ? (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className={adminLabelClass}>Note to customer (optional)</span>
            <textarea
              rows={2}
              value={note}
              disabled={isPending}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Please send the items to our Colombo store within 7 days."
              className={adminInputClass}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {canDecide ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => update("approved")}
                className={adminPrimaryButtonClass}
              >
                Approve
              </button>
            ) : null}
            {request.status === "pending" || request.status === "approved" ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => update("rejected")}
                className={adminDangerButtonClass}
              >
                Reject
              </button>
            ) : null}
            {request.status === "approved" ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => update("completed")}
                className={adminSecondaryButtonClass}
              >
                Mark received &amp; completed
              </button>
            ) : null}
          </div>
          {request.status === "approved" ? (
            <p className="font-body text-xs text-on-surface-variant">
              Completing a return sets the order status to Returned and emails the customer.
            </p>
          ) : null}
          {error ? <p className="font-body text-xs text-error">{error}</p> : null}
        </div>
      ) : request.admin_note ? (
        <p className="font-body mt-4 text-xs text-on-surface-variant">
          Note: {request.admin_note}
        </p>
      ) : null}
    </li>
  );
}

export function ReturnsAdmin({ requests }: { requests: AdminReturnRequest[] }) {
  const [filter, setFilter] = useState<Filter>("pending");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const result: Record<Filter, number> = {
      all: requests.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
    };
    for (const request of requests) result[request.status] += 1;
    return result;
  }, [requests]);

  const visible = requests.filter((request) => {
    if (filter !== "all" && request.status !== filter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [
      request.order?.order_number,
      request.order?.customer_name,
      request.order?.customer_email,
      request.reason,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });

  const filters: Filter[] = ["pending", "approved", "rejected", "completed", "all"];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Returns"
        description="Approve or reject customer return requests. Customers are emailed when you approve or reject."
      />

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={cn(
              "font-label border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em]",
              filter === value
                ? "border-primary bg-primary text-on-primary"
                : "border-outline-variant text-on-surface-variant hover:text-on-surface",
            )}
          >
            {value === "all" ? "All" : RETURN_STATUS_LABELS[value]} ({counts[value]})
          </button>
        ))}
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search order, customer, reason..."
          className={cn(adminInputClass, "ml-auto max-w-xs")}
        />
      </div>

      {visible.length === 0 ? (
        <AdminEmptyState>
          {requests.length === 0
            ? "No return requests yet."
            : "No return requests match this filter."}
        </AdminEmptyState>
      ) : (
        <ul className="grid gap-4 xl:grid-cols-2">
          {visible.map((request) => (
            <ReturnCard key={request.id} request={request} />
          ))}
        </ul>
      )}
    </div>
  );
}
