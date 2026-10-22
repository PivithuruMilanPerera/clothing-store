"use server";

import { revalidatePath } from "next/cache";
import { updateReturnRequestStatus } from "@/lib/returns";
import type { ReturnStatus } from "@/lib/types";

export async function setReturnStatusAction(
  id: string,
  status: ReturnStatus,
  adminNote?: string,
) {
  const result = await updateReturnRequestStatus(id, status, adminNote);
  if (result.success) {
    revalidatePath("/admin");
    revalidatePath("/admin/returns");
    revalidatePath("/admin/orders");
    revalidatePath("/account/returns");
  }
  return result;
}
