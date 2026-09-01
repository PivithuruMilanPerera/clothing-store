import type { CartItem, ProductColor, ProductSize } from "@/lib/types";

export const CART_STORAGE_KEY = "velvorz-cart";
export const GUEST_CART_STORAGE_KEY = "velvorz-guest-cart";
export const USER_CART_STORAGE_PREFIX = "velvorz-user-cart-";

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

export function mergeCartItems(
  baseItems: CartItem[],
  incomingItems: CartItem[],
): CartItem[] {
  const mergedMap = new Map<string, CartItem>();

  for (const item of baseItems) {
    mergedMap.set(item.id, { ...item });
  }

  for (const item of incomingItems) {
    const existing = mergedMap.get(item.id);
    if (existing) {
      mergedMap.set(item.id, {
        ...existing,
        quantity: existing.quantity + item.quantity,
      });
    } else {
      mergedMap.set(item.id, { ...item });
    }
  }

  return Array.from(mergedMap.values());
}

/** Reads guest cart from sessionStorage (session-based for guests) */
export function readGuestCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const sessionData = window.sessionStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (sessionData) {
      return JSON.parse(sessionData) as CartItem[];
    }

    // Migration fallback from old localStorage key if present
    const legacy = window.localStorage.getItem(CART_STORAGE_KEY);
    if (legacy) {
      const items = JSON.parse(legacy) as CartItem[];
      window.sessionStorage.setItem(GUEST_CART_STORAGE_KEY, legacy);
      window.localStorage.removeItem(CART_STORAGE_KEY);
      return items;
    }

    return [];
  } catch {
    return [];
  }
}

/** Writes guest cart to sessionStorage */
export function writeGuestCartToStorage(items: CartItem[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (items.length === 0) {
      window.sessionStorage.removeItem(GUEST_CART_STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(
        GUEST_CART_STORAGE_KEY,
        JSON.stringify(items),
      );
    }
  } catch {
    // Ignore storage quota or disabled errors
  }
}

export function clearGuestCartFromStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(GUEST_CART_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/** Reads registered customer cart from localStorage (persisted across sessions) */
export function readUserCartFromStorage(userId: string): CartItem[] {
  if (typeof window === "undefined" || !userId) {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(
      `${USER_CART_STORAGE_PREFIX}${userId}`,
    );
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as CartItem[];
  } catch {
    return [];
  }
}

/** Writes registered customer cart to localStorage */
export function writeUserCartToStorage(
  userId: string,
  items: CartItem[],
): void {
  if (typeof window === "undefined" || !userId) {
    return;
  }

  try {
    if (items.length === 0) {
      window.localStorage.removeItem(`${USER_CART_STORAGE_PREFIX}${userId}`);
    } else {
      window.localStorage.setItem(
        `${USER_CART_STORAGE_PREFIX}${userId}`,
        JSON.stringify(items),
      );
    }
  } catch {
    // Ignore
  }
}

export function clearUserCartFromStorage(userId: string): void {
  if (typeof window === "undefined" || !userId) {
    return;
  }

  try {
    window.localStorage.removeItem(`${USER_CART_STORAGE_PREFIX}${userId}`);
  } catch {
    // Ignore
  }
}

/** Legacy backwards-compatible storage reader */
export function readCartFromStorage(): CartItem[] {
  return readGuestCartFromStorage();
}

/** Legacy backwards-compatible storage writer */
export function writeCartToStorage(items: CartItem[]): void {
  writeGuestCartToStorage(items);
}
