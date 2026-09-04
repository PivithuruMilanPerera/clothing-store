"use server";

import { revalidatePath } from "next/cache";
import {
  markOrderCashCollected,
  updateOrderPaymentStatus,
  updateOrderStatus,
} from "@/lib/orders";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

export async function setOrderPaymentStatusAction(
  orderId: string,
  paymentStatus: PaymentStatus,
) {
  const result = await updateOrderPaymentStatus(orderId, paymentStatus);
  if (result.success) {
    revalidatePath("/admin/orders");
    revalidatePath("/account/orders");
  }
  return result;
}

export async function setOrderStatusAction(
  orderId: string,
  status: OrderStatus,
) {
  const result = await updateOrderStatus(orderId, status);
  if (result.success) {
    revalidatePath("/admin/orders");
    revalidatePath("/account/orders");
  }
  return result;
}

export async function markCashCollectedAction(orderId: string) {
  const result = await markOrderCashCollected(orderId);
  if (result.success) {
    revalidatePath("/admin/orders");
    revalidatePath("/account/orders");
  }
  return result;
}
