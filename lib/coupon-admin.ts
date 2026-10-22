import "server-only";

import { requireAdmin } from "@/lib/auth";
import { mapCouponRow, type Coupon } from "@/lib/coupons";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";

export type CouponWithUsage = Coupon & {
  usage: {
    orders: number;
    revenue: number;
    discountGiven: number;
    lastUsedAt: string | null;
  };
};

export async function getCouponsForAdmin(): Promise<{
  coupons: CouponWithUsage[];
  tableMissing: boolean;
}> {
  await requireAdmin();

  if (!hasAdminCredentials()) {
    return { coupons: [], tableMissing: false };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { coupons: [], tableMissing: true };
  }

  const coupons = (data ?? []).map(mapCouponRow);
  const usageByCode = new Map<string, CouponWithUsage["usage"]>();

  if (coupons.length > 0) {
    const { data: orders } = await supabase
      .from("orders")
      .select("coupon_code, total, discount, status, created_at")
      .not("coupon_code", "is", null)
      .neq("status", "cancelled");

    for (const order of orders ?? []) {
      const code = String(order.coupon_code).toUpperCase();
      const usage = usageByCode.get(code) ?? {
        orders: 0,
        revenue: 0,
        discountGiven: 0,
        lastUsedAt: null,
      };
      usage.orders += 1;
      usage.revenue += Number(order.total);
      usage.discountGiven += Number(order.discount ?? 0);
      if (!usage.lastUsedAt || order.created_at > usage.lastUsedAt) {
        usage.lastUsedAt = order.created_at;
      }
      usageByCode.set(code, usage);
    }
  }

  return {
    tableMissing: false,
    coupons: coupons.map((coupon) => ({
      ...coupon,
      usage: usageByCode.get(coupon.code.toUpperCase()) ?? {
        orders: 0,
        revenue: 0,
        discountGiven: 0,
        lastUsedAt: null,
      },
    })),
  };
}
