import type { CartItem, ProductColor, ProductSize } from "@/lib/types";

export const CART_STORAGE_KEY = "velvorz-cart";

export function getColorLabel(
  colorId: string,
  colorOptions?: Array<{ id: string; name: string }>,
  colorName?: string,
): string {
  if (colorName?.trim()) {
    return colorName.trim();
  }

  const match = colorOptions?.find((color) => color.id === colorId);
  if (match) {
    return match.name;
  }

  if (!colorId.includes("-")) {
    return colorId.charAt(0).toUpperCase() + colorId.slice(1);
  }

  return colorId;
}

export function getColorHex(
  colorId: string,
  colorOptions?: Array<{ id: string; hex: string }>,
): string | undefined {
  return colorOptions?.find((color) => color.id === colorId)?.hex;
}

export function createCartItemId(
  slug: string,
  color: ProductColor,
  size: ProductSize,
): string {
  return `${slug}-${color}-${size}`;
}

export function getCartSubtotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function readCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    return JSON.parse(stored) as CartItem[];
  } catch {
    return [];
  }
}

export function writeCartToStorage(items: CartItem[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}
