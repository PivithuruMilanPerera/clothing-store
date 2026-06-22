"use client";

import { useActionState } from "react";
import {
  createReturnRequest,
  type ActionState,
} from "@/app/account/actions";
import { Button } from "@/components/ui";
import type { Order, ReturnRequest, ReturnStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const initialState: ActionState | null = null;

type ReturnRequestsProps = {
  requests: ReturnRequest[];
  eligibleOrders: Order[];
};

const statusLabels: Record<ReturnStatus, string> = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

const returnReasons = [
  "Wrong size",
  "Damaged item",
  "Not as described",
  "Changed my mind",
  "Other",
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function ReturnRequests({
  requests,
  eligibleOrders,
}: ReturnRequestsProps) {
  const [state, formAction, isPending] = useActionState(
    createReturnRequest,
    initialState,
  );

  return (
    <div className="space-y-10">
      <section className="border border-outline-variant bg-surface-container-lowest p-6 md:p-8">
        <h2 className="font-headline text-lg font-bold leading-tight md:text-2xl text-on-surface">Request a Return</h2>

        {eligibleOrders.length === 0 ? (
          <p className="font-body text-base leading-normal mt-6 text-on-surface-variant">
            You do not have any eligible orders for a return request right now.
          </p>
        ) : (
          <form action={formAction} className="mt-6 max-w-xl space-y-6">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="orderId"
                className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface"
              >
                Order
              </label>
              <select
                id="orderId"
                name="orderId"
                required
                disabled={isPending}
                className="border-b border-primary bg-transparent pb-2 text-on-surface outline-none focus:border-b-2"
              >
                <option value="">Select an order</option>
                {eligibleOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.order_number} · {formatDate(order.created_at)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="reason"
                className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface"
              >
                Reason
              </label>
              <select
                id="reason"
                name="reason"
                required
                disabled={isPending}
                className="border-b border-primary bg-transparent pb-2 text-on-surface outline-none focus:border-b-2"
              >
                <option value="">Select a reason</option>
                {returnReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="details"
                className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface"
              >
                Additional Details
              </label>
              <textarea
                id="details"
                name="details"
                rows={4}
                disabled={isPending}
                className="border border-outline-variant bg-transparent p-3 text-on-surface outline-none focus:border-primary"
                placeholder="Optional notes about your return request"
              />
            </div>

            {state?.error ? (
              <p className="font-body text-base leading-normal text-error" role="alert">
                {state.error}
              </p>
            ) : null}

            {state?.success ? (
              <p className="font-body text-base leading-normal text-on-surface" role="status">
                {state.success}
              </p>
            ) : null}

            <Button type="submit" disabled={isPending}>
              {isPending ? "Submitting..." : "Submit Return Request"}
            </Button>
          </form>
        )}
      </section>

      {requests.length > 0 ? (
        <section>
          <h2 className="font-headline text-lg font-bold leading-tight md:text-2xl text-on-surface">
            Your Return Requests
          </h2>

          <ul className="mt-6 divide-y divide-outline-variant border border-outline-variant">
            {requests.map((request) => (
              <li
                key={request.id}
                className="grid gap-4 bg-surface-container-lowest px-5 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:px-6"
              >
                <div>
                  <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface">
                    {request.orders?.order_number ?? "Order"}
                  </p>
                  <p className="font-body text-base leading-normal mt-2 text-on-surface">
                    {request.reason}
                  </p>
                  {request.details ? (
                    <p className="font-body text-base leading-normal mt-2 text-on-surface-variant">
                      {request.details}
                    </p>
                  ) : null}
                  <p className="font-body text-base leading-normal mt-2 text-on-surface-variant">
                    Submitted {formatDate(request.created_at)}
                  </p>
                </div>

                <span
                  className={cn(
                    "font-label text-xs font-bold uppercase tracking-[0.15em] leading-none self-start border px-3 py-1",
                    request.status === "approved" || request.status === "completed"
                      ? "border-primary text-primary"
                      : request.status === "rejected"
                        ? "border-error text-error"
                        : "border-outline-variant text-on-surface-variant",
                  )}
                >
                  {statusLabels[request.status]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
