import type {
  CardPaymentOutcome,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
};

export function formatPaymentMethodLabel(value: string | undefined) {
  if (value === "cash_on_delivery") {
    return "Cash on Delivery";
  }

  if (value === "card") {
    return "Card Payment";
  }

  return value?.replaceAll("_", " ") || "—";
}

/**
 * Initial order + payment statuses by payment method:
 * - COD: Processing / Pending (paid only after cash is collected)
 * - Card success: Processing / Paid
 * - Card failed or incomplete: Pending / Failed or Pending
 */
export function resolveCheckoutStatuses(
  paymentMethod: PaymentMethod,
  cardOutcome: CardPaymentOutcome = "incomplete",
): { status: OrderStatus; paymentStatus: PaymentStatus } {
  if (paymentMethod === "cash_on_delivery") {
    return { status: "processing", paymentStatus: "pending" };
  }

  if (cardOutcome === "success") {
    return { status: "processing", paymentStatus: "paid" };
  }

  return {
    status: "pending",
    paymentStatus: cardOutcome === "failed" ? "failed" : "pending",
  };
}

export function orderStatusBadgeClass(status: OrderStatus) {
  switch (status) {
    case "delivered":
      return "border-green-600/30 bg-green-600/10 text-green-600";
    case "cancelled":
      return "border-error/30 bg-error/10 text-error";
    case "shipped":
      return "border-primary/30 bg-primary/10 text-primary";
    case "processing":
      return "border-orange-400/30 bg-orange-400/10 text-orange-400";
    case "pending":
    default:
      return "border-amber-500/30 bg-amber-500/10 text-amber-700";
  }
}

export function paymentStatusBadgeClass(status: PaymentStatus) {
  switch (status) {
    case "paid":
      return "border-green-600/30 bg-green-600/10 text-green-600";
    case "failed":
      return "border-error/30 bg-error/10 text-error";
    case "pending":
    default:
      return "border-amber-500/30 bg-amber-500/10 text-amber-700";
  }
}

export function normalizePaymentStatus(
  value: string | null | undefined,
): PaymentStatus {
  if (value === "paid" || value === "failed" || value === "pending") {
    return value;
  }

  return "pending";
}
