export const LOW_STOCK_THRESHOLD = 10;

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

export function isLowStock(inventory: number): boolean {
  return inventory > 0 && inventory <= LOW_STOCK_THRESHOLD;
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

export function getProductStockState(variants: Array<{ inventory: number }>) {
  const totalInventory = getTotalInventory(variants);

  return {
    totalInventory,
    isOutOfStock: isOutOfStock(totalInventory),
    isLowStock:
      !isOutOfStock(totalInventory) &&
      variants.some((variant) => isLowStock(variant.inventory)),
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
