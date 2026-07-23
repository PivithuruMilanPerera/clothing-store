export const LOW_STOCK_THRESHOLD = 10;

export type VariantStock = {
  colorId: string;
  sizeId: string;
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

export function getVariantInventory(
  variants: VariantStock[],
  colorId: string,
  sizeId: string,
): number {
  return (
    variants.find(
      (variant) =>
        variant.colorId === colorId && variant.sizeId === sizeId,
    )?.inventory ?? 0
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
