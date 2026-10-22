"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  markCashCollectedAction,
  setOrderPaymentStatusAction,
  setOrderStatusAction,
} from "@/app/admin/(dashboard)/orders/actions";
import {
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
} from "@/components/admin/AdminUi";
import {
  normalizePaymentStatus,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/order-status";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types";

const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ["pending", "paid", "failed"];

export function OrderStatusControls({ order }: { order: Order }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus>(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number ?? "");
  const [note, setNote] = useState("");
  const paymentStatus = normalizePaymentStatus(order.payment_status);
  const isCod = order.payment_method === "cash_on_delivery";
  const trackingChanged = trackingNumber.trim() !== (order.tracking_number ?? "");

  function run(action: () => Promise<{ success: boolean; error?: string }>, done: string) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.error || "Update failed.");
        return;
      }
      setNote("");
      setMessage(done);
      router.refresh();
    });
  }

  function handleStatusSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (nextStatus === order.status && !trackingChanged && !note.trim()) {
      setError("Change the status, tracking number, or add a note first.");
      return;
    }

    if (nextStatus === "shipped" && !trackingNumber.trim()) {
      setError("Enter a tracking number before marking this order as shipped.");
      return;
    }

    run(
      () =>
        setOrderStatusAction(
          order.id,
          nextStatus,
          trackingNumber.trim() || undefined,
          note.trim() || undefined,
        ),
      nextStatus === order.status
        ? "Order updated."
        : `Order marked ${ORDER_STATUS_LABELS[nextStatus].toLowerCase()}. The customer has been notified.`,
    );
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleStatusSubmit} className="space-y-3">
        <label className="block">
          <span className={adminLabelClass}>Order status</span>
          <select
            value={nextStatus}
            disabled={isPending}
            onChange={(event) => setNextStatus(event.target.value as OrderStatus)}
            className={adminInputClass}
          >
            {ORDER_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={adminLabelClass}>Tracking number</span>
          <input
            type="text"
            value={trackingNumber}
            disabled={isPending}
            onChange={(event) => setTrackingNumber(event.target.value)}
            placeholder="Required when marking as shipped"
            className={adminInputClass}
          />
        </label>

        <label className="block">
          <span className={adminLabelClass}>Internal note (optional)</span>
          <textarea
            value={note}
            disabled={isPending}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="e.g. Handed to courier at 3pm"
            className={adminInputClass}
          />
        </label>

        <button type="submit" disabled={isPending} className={`${adminPrimaryButtonClass} w-full`}>
          {isPending ? "Saving..." : "Update order"}
        </button>
      </form>

      <div className="border-t border-outline-variant pt-5">
        <label className="block">
          <span className={adminLabelClass}>Payment status</span>
          <select
            value={paymentStatus}
            disabled={isPending}
            onChange={(event) => {
              const value = event.target.value as PaymentStatus;
              if (value === paymentStatus) return;
              run(
                () => setOrderPaymentStatusAction(order.id, value),
                `Payment marked ${PAYMENT_STATUS_LABELS[value].toLowerCase()}.`,
              );
            }}
            className={adminInputClass}
          >
            {PAYMENT_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {PAYMENT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>

        {isCod && paymentStatus === "pending" ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              run(() => markCashCollectedAction(order.id), "Cash collected; order delivered.")
            }
            className="font-label mt-3 w-full border border-green-600/30 bg-green-600/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-green-700 hover:bg-green-600/15 disabled:opacity-60"
          >
            Mark cash collected
          </button>
        ) : null}
      </div>

      {error ? <p className="font-body text-xs text-error">{error}</p> : null}
      {message ? <p className="font-body text-xs text-green-700">{message}</p> : null}
    </div>
  );
}
