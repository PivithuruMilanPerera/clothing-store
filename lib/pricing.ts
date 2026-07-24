import type { DiscountType } from "@/lib/types";

type PriceComputation = {
  finalPrice: number;
  discountAmount: number;
  hasDiscount: boolean;
};

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

export function computeFinalPrice(
  basePrice: number,
  discountType: DiscountType | null,
  discountValue: number,
): PriceComputation {
  const safeBasePrice = Number.isFinite(basePrice) ? Math.max(0, basePrice) : 0;
  const safeDiscountValue = Number.isFinite(discountValue) ? Math.max(0, discountValue) : 0;

  if (!discountType || safeDiscountValue <= 0) {
    return {
      finalPrice: roundMoney(safeBasePrice),
      discountAmount: 0,
      hasDiscount: false,
    };
  }

  const rawDiscount =
    discountType === "percentage"
      ? (safeBasePrice * safeDiscountValue) / 100
      : safeDiscountValue;

  const discountAmount = roundMoney(Math.min(rawDiscount, safeBasePrice));
  const finalPrice = roundMoney(Math.max(safeBasePrice - discountAmount, 0));

  return {
    finalPrice,
    discountAmount,
    hasDiscount: discountAmount > 0,
  };
}

/** e.g. "Sale -20%" for corner ribbons; null when there is no discount. */
export function formatSaleLabel(
  discountType: DiscountType | null,
  discountValue: number,
  basePrice: number,
  discountAmount: number,
): string | null {
  if (discountAmount <= 0) {
    return null;
  }

  const percent =
    discountType === "percentage"
      ? Math.round(discountValue)
      : basePrice > 0
        ? Math.round((discountAmount / basePrice) * 100)
        : 0;

  if (percent <= 0) {
    return null;
  }

  return `Sale -${percent}%`;
}
