export const LOW_STOCK_THRESHOLD = 5;

export type VariantStock = {
  colorId: string;
  sizeId: string;
  sizeLabel?: string;
  inventory: number;
};

export function getVariantKey(colorId: string, sizeId: string): string {
  return `${colorId}:${sizeId}`;
}

export function getTotalInventory(variants: Array<{ inventory: number }>): number {
  return variants.reduce((sum, variant) => sum + variant.inventory, 0);
}

export function isOutOfStock(inventory: number): boolean {
  return inventory <= 0;
}

export function resolveLowStockThreshold(
  threshold: number | null | undefined,
): number {
  return typeof threshold === "number" && Number.isFinite(threshold) && threshold >= 0
    ? threshold
    : LOW_STOCK_THRESHOLD;
}

export function isLowStock(
  inventory: number,
  threshold: number = LOW_STOCK_THRESHOLD,
): boolean {
  return inventory > 0 && inventory <= threshold;
}

/** True when stock moves from above the threshold into the low-stock range. */
export function crossedIntoLowStock(
  previousInventory: number,
  nextInventory: number,
  threshold: number = LOW_STOCK_THRESHOLD,
): boolean {
  return (
    previousInventory > threshold && isLowStock(nextInventory, threshold)
  );
}

export type LowStockAlert = {
  productName: string;
  productSlug: string;
  color?: string | null;
  size?: string | null;
  remaining: number;
  threshold?: number;
};

export function variantStockKey(colorId: string, sizeId: string): string {
  return `${colorId || ""}:${sizeId || ""}`;
}

/** Collect alerts for variants that newly entered the low-stock range. */
export function collectCrossedLowStockAlerts(params: {
  productName: string;
  productSlug: string;
  threshold?: number;
  previous: Array<{
    colorId: string;
    sizeId: string;
    inventory: number;
    colorName?: string | null;
    sizeLabel?: string | null;
  }>;
  next: Array<{
    colorId: string;
    sizeId: string;
    inventory: number;
    colorName?: string | null;
    sizeLabel?: string | null;
  }>;
}): LowStockAlert[] {
  const previousByKey = new Map(
    params.previous.map((variant) => [
      variantStockKey(variant.colorId, variant.sizeId),
      variant,
    ]),
  );

  const alerts: LowStockAlert[] = [];
  const seen = new Set<string>();

  for (const variant of params.next) {
    const key = variantStockKey(variant.colorId, variant.sizeId);
    const previous = previousByKey.get(key);
    if (!previous) {
      continue;
    }

    if (
      !crossedIntoLowStock(previous.inventory, variant.inventory, params.threshold)
    ) {
      continue;
    }

    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    alerts.push({
      productName: params.productName,
      productSlug: params.productSlug,
      color: variant.colorName || previous.colorName || null,
      size: variant.sizeLabel || previous.sizeLabel || null,
      remaining: variant.inventory,
      threshold: params.threshold ?? LOW_STOCK_THRESHOLD,
    });
  }

  return alerts;
}

export function matchesVariantStock(
  variant: VariantStock,
  colorId: string,
  sizeLabel: string,
): boolean {
  const hasColor = Boolean(variant.colorId);
  const hasSize = Boolean(variant.sizeId || variant.sizeLabel);

  if (hasColor && hasSize) {
    return variant.colorId === colorId && variant.sizeLabel === sizeLabel;
  }

  if (hasColor) {
    return variant.colorId === colorId;
  }

  if (hasSize) {
    return variant.sizeLabel === sizeLabel;
  }

  return false;
}

export function getVariantInventory(
  variants: VariantStock[],
  colorId: string,
  sizeLabel: string,
): number {
  return (
    variants.find((variant) => matchesVariantStock(variant, colorId, sizeLabel))
      ?.inventory ?? 0
  );
}

export function getProductStockState(
  variants: Array<{ inventory: number }>,
  threshold: number = LOW_STOCK_THRESHOLD,
) {
  const totalInventory = getTotalInventory(variants);

  return {
    totalInventory,
    isOutOfStock: isOutOfStock(totalInventory),
    isLowStock:
      !isOutOfStock(totalInventory) &&
      variants.some((variant) => isLowStock(variant.inventory, threshold)),
  };
}

export type ProductVariantRow = {
  id: string;
  color_id: string | null;
  size_id: string | null;
  inventory: number;
  colors?:
    | { id: string; name: string; hex?: string }
    | Array<{ id: string; name: string; hex?: string }>
    | null;
  sizes?:
    | { id: string; label: string }
    | Array<{ id: string; label: string }>
    | null;
};

export function findMatchingProductVariant(
  variants: ProductVariantRow[],
  color: string,
  colorName: string | undefined,
  size: string,
): ProductVariantRow | undefined {
  const itemColorLower = (colorName || color || "").toLowerCase().trim();
  const itemSizeUpper = (size || "").toUpperCase().trim();

  return variants.find((variant) => {
    const colorObj = Array.isArray(variant.colors)
      ? variant.colors[0]
      : variant.colors;
    const sizeObj = Array.isArray(variant.sizes)
      ? variant.sizes[0]
      : variant.sizes;

    const colorMatches =
      !variant.color_id ||
      variant.color_id === color ||
      (colorObj?.id && colorObj.id === color) ||
      (colorObj?.name && colorObj.name.toLowerCase().trim() === itemColorLower);

    const sizeMatches =
      !variant.size_id ||
      (sizeObj?.label && sizeObj.label.toUpperCase().trim() === itemSizeUpper) ||
      variant.size_id === size;

    return colorMatches && sizeMatches;
  });
}
