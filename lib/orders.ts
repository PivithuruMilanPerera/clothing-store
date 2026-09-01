import type { OrderStatus } from "@/lib/types";

const CANCELLABLE_ORDER_STATUSES: OrderStatus[] = ["pending", "processing"];

export function isOrderCancellable(status: OrderStatus): boolean {
  return CANCELLABLE_ORDER_STATUSES.includes(status);
}

export const cancellableOrderStatuses = CANCELLABLE_ORDER_STATUSES;
