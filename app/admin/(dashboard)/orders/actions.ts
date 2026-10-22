"use server";

import { revalidatePath } from "next/cache";
import {
  markOrderCashCollected,
  updateOrderPaymentStatus,
  updateOrderStatus,
} from "@/lib/orders";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

function revalidateOrderPaths(orderId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
}

export async function setOrderPaymentStatusAction(
  orderId: string,
  paymentStatus: PaymentStatus,
) {
  const result = await updateOrderPaymentStatus(orderId, paymentStatus);
  if (result.success) {
    revalidateOrderPaths(orderId);
  }
  return result;
}

export async function setOrderStatusAction(
  orderId: string,
  status: OrderStatus,
  trackingNumber?: string | null,
  note?: string | null,
) {
  const result = await updateOrderStatus(orderId, status, { trackingNumber, note });
  if (result.success) {
    revalidateOrderPaths(orderId);
  }
  return result;
}

export async function markCashCollectedAction(orderId: string) {
  const result = await markOrderCashCollected(orderId);
  if (result.success) {
    revalidateOrderPaths(orderId);
  }
  return result;
}
