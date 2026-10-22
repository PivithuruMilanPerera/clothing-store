"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { useActionState } from "react";
import {
  createReturnRequest,
  type ActionState,
} from "@/app/account/actions";
import { Button } from "@/components/ui";
import type { Order, OrderItem, ReturnRequest, ReturnStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const initialState: ActionState | null = null;

type ReturnRequestsProps = {
  requests: ReturnRequest[];
  eligibleOrders: Order[];
};

type ReturnItemChoice = {
  id: string;
  orderNumber: string;
  name: string;
  image: string | null;
  color: string | null;
  size: string | null;
  quantity: number;
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

function itemMeta(item: {
  color?: string | null;
  size?: string | null;
  quantity?: number;
  orderNumber?: string;
}) {
  return [
    item.color,
    item.size,
    item.quantity && item.quantity > 1 ? `Qty ${item.quantity}` : null,
    item.orderNumber,
  ]
    .filter(Boolean)
    .join(" · ");
}

function requestItem(
  request: ReturnRequest,
): Pick<OrderItem, "product_name" | "image" | "color" | "size"> | null {
  const raw = request.order_items;
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

function ItemThumb({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative block h-12 w-10 shrink-0 overflow-hidden bg-surface-container-low",
        className,
      )}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes="40px" className="object-cover" />
      ) : null}
    </span>
  );
}

function ItemDropdown({
  items,
  disabled,
  resetKey,
}: {
  items: ReturnItemChoice[];
  disabled: boolean;
  resetKey: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const selected = items.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    setSelectedId("");
    setOpen(false);
  }, [resetKey]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name="orderItemId" value={selectedId} />
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby="return-item-label"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-3 border-b border-primary bg-transparent py-2 text-left outline-none focus:border-b-2 disabled:opacity-60"
      >
        {selected ? (
          <>
            <ItemThumb src={selected.image} alt="" />
            <span className="min-w-0">
              <span className="block truncate font-body text-base text-on-surface">
                {selected.name}
              </span>
              <span className="mt-1 block truncate font-body text-sm text-on-surface-variant">
                {itemMeta(selected)}
              </span>
            </span>
          </>
        ) : (
          <span className="font-body text-base text-on-surface-variant">
            Select an item
          </span>
        )}
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-80 w-full overflow-auto border border-outline-variant bg-surface-container-lowest shadow-sm"
        >
          {items.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <li key={item.id} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(item.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface-container-low",
                    isSelected && "bg-surface-container-low",
                  )}
                >
                  <ItemThumb src={item.image} alt={item.name} />
                  <span className="min-w-0">
                    <span className="block truncate font-body text-base text-on-surface">
                      {item.name}
                    </span>
                    <span className="mt-1 block truncate font-body text-sm text-on-surface-variant">
                      {itemMeta(item)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function ReturnRequests({
  requests,
  eligibleOrders,
}: ReturnRequestsProps) {
  const [state, formAction, isPending] = useActionState(
    createReturnRequest,
    initialState,
  );

  const blockedOrderIds = new Set(
    requests
      .filter((request) => request.status !== "rejected" && !request.order_item_id)
      .map((request) => request.order_id),
  );
  const blockedItemIds = new Set(
    requests
      .filter((request) => request.status !== "rejected" && request.order_item_id)
      .map((request) => request.order_item_id),
  );

  const items: ReturnItemChoice[] = eligibleOrders.flatMap((order) => {
    if (blockedOrderIds.has(order.id)) return [];
    return (order.order_items ?? [])
      .filter((item) => !blockedItemIds.has(item.id))
      .map((item) => ({
        id: item.id,
        orderNumber: order.order_number,
        name: item.product_name,
        image: item.image,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
      }));
  });

  return (
    <div className="space-y-10">
      <section className="border border-outline-variant bg-surface-container-lowest p-6 md:p-8">
        <h2 className="font-headline text-lg font-bold leading-tight text-on-surface md:text-2xl">
          Request a Return
        </h2>

        {items.length === 0 ? (
          <p className="font-body mt-6 text-base leading-normal text-on-surface-variant">
            You do not have any eligible items for a return request right now.
          </p>
        ) : (
          <form action={formAction} className="mt-6 max-w-xl space-y-6">
            <div className="flex flex-col gap-2">
              <label
                id="return-item-label"
                className="font-label text-xs font-bold uppercase leading-none tracking-[0.15em] text-on-surface"
              >
                Item
              </label>
              <ItemDropdown
                items={items}
                disabled={isPending}
                resetKey={state?.success ?? ""}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="reason"
                className="font-label text-xs font-bold uppercase leading-none tracking-[0.15em] text-on-surface"
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
                className="font-label text-xs font-bold uppercase leading-none tracking-[0.15em] text-on-surface"
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
          <h2 className="font-headline text-lg font-bold leading-tight text-on-surface md:text-2xl">
            Your Return Requests
          </h2>

          <ul className="mt-6 divide-y divide-outline-variant border border-outline-variant">
            {requests.map((request) => {
              const item = requestItem(request);
              return (
                <li
                  key={request.id}
                  className="grid gap-4 bg-surface-container-lowest px-5 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:px-6"
                >
                  <div className="flex gap-4">
                    {item ? <ItemThumb src={item.image} alt={item.product_name} /> : null}
                    <div>
                      <p className="font-label text-xs font-bold uppercase leading-none tracking-[0.15em] text-on-surface">
                        {item?.product_name ?? request.orders?.order_number ?? "Item"}
                      </p>
                      <p className="font-body mt-2 text-sm leading-normal text-on-surface-variant">
                        {item
                          ? itemMeta({
                              color: item.color,
                              size: item.size,
                              orderNumber: request.orders?.order_number,
                            })
                          : (request.orders?.order_number ?? "Order")}
                      </p>
                      <p className="font-body mt-2 text-base leading-normal text-on-surface">
                        {request.reason}
                      </p>
                      {request.details ? (
                        <p className="font-body mt-2 text-base leading-normal text-on-surface-variant">
                          {request.details}
                        </p>
                      ) : null}
                      {request.admin_note ? (
                        <p className="font-body mt-2 text-sm leading-normal text-on-surface">
                          <span className="font-semibold">VELVORZ: </span>
                          {request.admin_note}
                        </p>
                      ) : null}
                      <p className="font-body mt-2 text-base leading-normal text-on-surface-variant">
                        Submitted {formatDate(request.created_at)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "font-label self-start border px-3 py-1 text-xs font-bold uppercase leading-none tracking-[0.15em]",
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
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
