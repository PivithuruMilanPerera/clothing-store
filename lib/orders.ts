import { requireAdmin } from "@/lib/auth";
import { normalizePaymentStatus } from "@/lib/order-status";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types";

const CANCELLABLE_ORDER_STATUSES: OrderStatus[] = ["pending", "processing"];
const ADMIN_ORDERS_PAGE_SIZE = 1000;

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

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  if (!hasAdminCredentials()) {
    return { success: false, error: "Missing admin credentials." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    console.error("Failed to update order status:", error.message);
    return { success: false, error: error.message };
  }

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

  return { success: true };
}
