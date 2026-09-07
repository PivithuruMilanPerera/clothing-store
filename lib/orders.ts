import { requireAdmin } from "@/lib/auth";
import {
  buildOrderEmailPayloadFromOrder,
  sendOrderStatusUpdateEmail,
} from "@/lib/order-emails";
import { normalizePaymentStatus } from "@/lib/order-status";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types";

const CANCELLABLE_ORDER_STATUSES: OrderStatus[] = ["pending", "processing"];
const ADMIN_ORDERS_PAGE_SIZE = 1000;
const STATUS_UPDATE_EMAIL_STATUSES: OrderStatus[] = [
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

export function isOrderCancellable(status: OrderStatus): boolean {
  return CANCELLABLE_ORDER_STATUSES.includes(status);
}

export const cancellableOrderStatuses = CANCELLABLE_ORDER_STATUSES;

function normalizeOrder(order: Order): Order {
  return {
    ...order,
    payment_status: normalizePaymentStatus(order.payment_status),
  };
}

export async function getAllOrdersForAdmin(): Promise<Order[]> {
  await requireAdmin();

  if (!hasAdminCredentials()) {
    console.error("Failed to load admin orders: missing Supabase admin credentials.");
    return [];
  }

  const supabase = createAdminClient();
  const orders: Order[] = [];

  for (let from = 0; ; from += ADMIN_ORDERS_PAGE_SIZE) {
    const to = from + ADMIN_ORDERS_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Failed to load admin orders:", error.message);
      return orders;
    }

    const page = ((data ?? []) as Order[]).map(normalizeOrder);
    orders.push(...page);

    if (page.length < ADMIN_ORDERS_PAGE_SIZE) {
      break;
    }
  }

  return orders;
}

export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  if (!hasAdminCredentials()) {
    return { success: false, error: "Missing admin credentials." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    console.error("Failed to update payment status:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

async function notifyCustomerOrderStatus(
  orderId: string,
  status: OrderStatus,
) {
  if (!STATUS_UPDATE_EMAIL_STATUSES.includes(status)) {
    return;
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (error || !data) {
      console.error(
        "Failed to load order for status email:",
        error?.message || "Order not found.",
      );
      return;
    }

    const order = normalizeOrder(data as Order);
    await sendOrderStatusUpdateEmail(buildOrderEmailPayloadFromOrder(order));
  } catch (error) {
    console.error("Failed to send order status email:", error);
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  options?: { trackingNumber?: string | null },
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  if (!hasAdminCredentials()) {
    return { success: false, error: "Missing admin credentials." };
  }

  const trackingNumber = options?.trackingNumber?.trim() || null;

  if (status === "shipped" && !trackingNumber) {
    return {
      success: false,
      error: "Tracking number is required when marking an order as shipped.",
    };
  }

  const supabase = createAdminClient();
  const updatePayload: {
    status: OrderStatus;
    updated_at: string;
    tracking_number?: string | null;
  } = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "shipped") {
    updatePayload.tracking_number = trackingNumber;
  } else if (trackingNumber) {
    updatePayload.tracking_number = trackingNumber;
  }

  const { error } = await supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", orderId);

  if (error) {
    console.error("Failed to update order status:", error.message);
    return { success: false, error: error.message };
  }

  await notifyCustomerOrderStatus(orderId, status);

  return { success: true };
}

/** COD: mark cash collected → payment paid + order delivered. */
export async function markOrderCashCollected(
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  if (!hasAdminCredentials()) {
    return { success: false, error: "Missing admin credentials." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      status: "delivered",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    console.error("Failed to mark cash collected:", error.message);
    return { success: false, error: error.message };
  }

  await notifyCustomerOrderStatus(orderId, "delivered");

  return { success: true };
}
