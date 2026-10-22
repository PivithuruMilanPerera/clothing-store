import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

export type OrderHistoryEntry = {
  id: string;
  order_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus | null;
  tracking_number: string | null;
  note: string | null;
  changed_by_email: string | null;
  created_at: string;
};

/** Appends a timeline entry. Never throws — history must not block order updates. */
export async function recordOrderHistory(
  dbClient: SupabaseClient,
  entry: {
    orderId: string;
    status: OrderStatus;
    paymentStatus?: PaymentStatus | null;
    trackingNumber?: string | null;
    note?: string | null;
    actor?: { id: string; email?: string | null } | null;
  },
): Promise<void> {
  try {
    const { error } = await dbClient.from("order_status_history").insert({
      order_id: entry.orderId,
      status: entry.status,
      payment_status: entry.paymentStatus ?? null,
      tracking_number: entry.trackingNumber?.trim() || null,
      note: entry.note?.trim() || null,
      changed_by: entry.actor?.id ?? null,
      changed_by_email: entry.actor?.email ?? null,
    });

    if (error) {
      console.error("Failed to record order history:", error.message);
    }
  } catch (error) {
    console.error("Failed to record order history:", error);
  }
}

export async function getOrderHistory(
  dbClient: SupabaseClient,
  orderId: string,
): Promise<OrderHistoryEntry[]> {
  const { data, error } = await dbClient
    .from("order_status_history")
    .select(
      "id, order_id, status, payment_status, tracking_number, note, changed_by_email, created_at",
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as OrderHistoryEntry[];
}
