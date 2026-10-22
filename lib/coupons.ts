import type { DiscountType } from "@/lib/types";

export type Coupon = {
  id: string;
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CouponStatus = "active" | "inactive" | "scheduled" | "expired" | "exhausted";

export function normalizeCouponCode(code: string | null | undefined): string {
  return (code ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapCouponRow(row: Record<string, unknown>): Coupon {
  return {
    id: String(row.id),
    code: String(row.code ?? ""),
    description: String(row.description ?? ""),
    discount_type: row.discount_type === "fixed" ? "fixed" : "percentage",
    discount_value: Number(row.discount_value ?? 0),
    min_order_amount: Number(row.min_order_amount ?? 0),
    max_discount_amount: toNullableNumber(row.max_discount_amount),
    usage_limit: toNullableNumber(row.usage_limit),
    used_count: Number(row.used_count ?? 0),
    starts_at: (row.starts_at as string | null) ?? null,
    expires_at: (row.expires_at as string | null) ?? null,
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export function getCouponStatus(coupon: Coupon, now = new Date()): CouponStatus {
  if (!coupon.is_active) return "inactive";
  if (coupon.starts_at && new Date(coupon.starts_at) > now) return "scheduled";
  if (coupon.expires_at && new Date(coupon.expires_at) < now) return "expired";
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    return "exhausted";
  }
  return "active";
}

export const COUPON_STATUS_LABELS: Record<CouponStatus, string> = {
  active: "Active",
  inactive: "Deactivated",
  scheduled: "Scheduled",
  expired: "Expired",
  exhausted: "Limit reached",
};

export function computeCouponDiscount(coupon: Coupon, subtotal: number): number {
  if (subtotal <= 0) return 0;

  let discount =
    coupon.discount_type === "percentage"
      ? (subtotal * coupon.discount_value) / 100
      : coupon.discount_value;

  if (coupon.max_discount_amount !== null) {
    discount = Math.min(discount, coupon.max_discount_amount);
  }

  discount = Math.min(discount, subtotal);
  return Math.round(discount * 100) / 100;
}

export type CouponValidation =
  | { valid: true; coupon: Coupon; discount: number }
  | { valid: false; error: string };

export function validateCoupon(
  coupon: Coupon | null,
  subtotal: number,
  now = new Date(),
): CouponValidation {
  if (!coupon) {
    return { valid: false, error: "This coupon code is not valid." };
  }

  const status = getCouponStatus(coupon, now);
  if (status === "inactive" || status === "expired") {
    return { valid: false, error: "This coupon code has expired or is no longer active." };
  }
  if (status === "scheduled") {
    return { valid: false, error: "This coupon code is not active yet." };
  }
  if (status === "exhausted") {
    return { valid: false, error: "This coupon code has reached its usage limit." };
  }
  if (subtotal < coupon.min_order_amount) {
    return {
      valid: false,
      error: `This coupon requires a minimum order of Rs. ${coupon.min_order_amount.toLocaleString("en-LK")}.`,
    };
  }

  return { valid: true, coupon, discount: computeCouponDiscount(coupon, subtotal) };
}

export function describeCoupon(coupon: Pick<Coupon, "discount_type" | "discount_value" | "max_discount_amount">) {
  const base =
    coupon.discount_type === "percentage"
      ? `${coupon.discount_value}% off`
      : `Rs. ${coupon.discount_value.toLocaleString("en-LK")} off`;
  return coupon.max_discount_amount !== null && coupon.discount_type === "percentage"
    ? `${base} (max Rs. ${coupon.max_discount_amount.toLocaleString("en-LK")})`
    : base;
}
