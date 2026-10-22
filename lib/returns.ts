import "server-only";

import { getCurrentAdmin, requireAdmin } from "@/lib/auth";
import { sendReturnDecisionEmail } from "@/lib/order-emails";
import { updateOrderStatus } from "@/lib/orders";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import type { OrderStatus, ReturnStatus } from "@/lib/types";

export type AdminReturnRequest = {
  id: string;
  user_id: string;
  order_id: string;
  reason: string;
  details: string | null;
  status: ReturnStatus;
  admin_note: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  order: {
    id: string;
    order_number: string;
    status: OrderStatus;
    total: number;
    created_at: string;
    customer_name: string | null;
    customer_email: string | null;
    customer_phone: string | null;
    item_count: number;
  } | null;
  item: {
    product_name: string;
    image: string | null;
    color: string | null;
    size: string | null;
  } | null;
};

type ReturnItemEmbed = NonNullable<AdminReturnRequest["item"]>;

type ReturnRow = Omit<AdminReturnRequest, "order" | "item"> & {
  orders:
    | (Omit<NonNullable<AdminReturnRequest["order"]>, "item_count"> & {
        order_items: Array<{ quantity: number }> | null;
      })
    | null;
  order_items?: ReturnItemEmbed | ReturnItemEmbed[] | null;
};

export async function getReturnRequestsForAdmin(): Promise<AdminReturnRequest[]> {
  await requireAdmin();

  if (!hasAdminCredentials()) {
    return [];
  }

  const supabase = createAdminClient();
  const withItem = await supabase
    .from("return_requests")
    .select(
      "*, orders(id, order_number, status, total, created_at, customer_name, customer_email, customer_phone, order_items(quantity)), order_items!order_item_id(product_name, image, color, size)",
    )
    .order("created_at", { ascending: false });

  const fallback = withItem.error
    ? await supabase
        .from("return_requests")
        .select(
          "*, orders(id, order_number, status, total, created_at, customer_name, customer_email, customer_phone, order_items(quantity))",
        )
        .order("created_at", { ascending: false })
    : null;

  const data = withItem.error ? fallback?.data : withItem.data;
  const error = withItem.error ? fallback?.error : null;

  if (error || !data) {
    if (error) console.error("Failed to load return requests:", error.message);
    return [];
  }

  return (data as ReturnRow[]).map(({ orders, order_items: lineItem, ...request }) => {
    const item = Array.isArray(lineItem) ? lineItem[0] ?? null : lineItem ?? null;
    return {
      ...request,
      admin_note: request.admin_note ?? null,
      resolved_at: request.resolved_at ?? null,
      item,
      order: orders
        ? {
            id: orders.id,
            order_number: orders.order_number,
            status: orders.status,
            total: Number(orders.total),
            created_at: orders.created_at,
            customer_name: orders.customer_name,
            customer_email: orders.customer_email,
            customer_phone: orders.customer_phone,
            item_count: (orders.order_items ?? []).reduce(
              (sum, entry) => sum + entry.quantity,
              0,
            ),
          }
        : null,
    };
  });
}

const ALLOWED_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["completed", "rejected"],
  rejected: ["approved"],
  completed: [],
};

export async function updateReturnRequestStatus(
  id: string,
  nextStatus: ReturnStatus,
  adminNote?: string | null,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  if (!hasAdminCredentials()) {
    return { success: false, error: "Missing admin credentials." };
  }

  const supabase = createAdminClient();
  const { data: request, error: loadError } = await supabase
    .from("return_requests")
    .select("id, status, reason, order_id, orders(order_number, customer_name, customer_email)")
    .eq("id", id)
    .single();

  if (loadError || !request) {
    return { success: false, error: "Return request not found." };
  }

  const currentStatus = request.status as ReturnStatus;
  if (!ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus)) {
    return {
      success: false,
      error: `A ${currentStatus} return cannot be marked ${nextStatus}.`,
    };
  }

  const admin = await getCurrentAdmin();
  const note = adminNote?.trim() || null;
  const now = new Date().toISOString();

  const fullUpdate = {
    status: nextStatus,
    admin_note: note,
    resolved_at: now,
    resolved_by: admin?.id ?? null,
    updated_at: now,
  };

  let { error } = await supabase.from("return_requests").update(fullUpdate).eq("id", id);

  if (error && /admin_note|resolved_/.test(error.message)) {
    ({ error } = await supabase
      .from("return_requests")
      .update({ status: nextStatus, updated_at: now })
      .eq("id", id));
  }

  if (error) {
    console.error("Failed to update return request:", error.message);
    return { success: false, error: error.message };
  }

  const order = (Array.isArray(request.orders) ? request.orders[0] : request.orders) as
    | { order_number: string; customer_name: string | null; customer_email: string | null }
    | null;

  if (nextStatus === "completed") {
    const result = await updateOrderStatus(request.order_id, "returned", {
      note: note ? `Return completed: ${note}` : "Return completed",
    });
    if (!result.success) {
      return {
        success: false,
        error: `Return marked completed, but the order status could not be updated: ${result.error}`,
      };
    }
  }

  if ((nextStatus === "approved" || nextStatus === "rejected") && order) {
    await sendReturnDecisionEmail({
      decision: nextStatus,
      orderNumber: order.order_number,
      customerName: order.customer_name?.trim() || "Customer",
      customerEmail: order.customer_email?.trim() || "",
      reason: request.reason,
      adminNote: note,
    });
  }

  return { success: true };
}
