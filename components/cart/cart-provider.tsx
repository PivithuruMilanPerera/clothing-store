"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getCurrentUserId,
  loadUserCartFromDb,
  syncUserCartToDb,
  validateCartStock,
} from "@/lib/cart-actions";
import {
  clearGuestCartFromStorage,
  createCartItemId,
  getCartItemCount,
  getCartSubtotal,
  mergeCartItems,
  readGuestCartFromStorage,
  readUserCartFromStorage,
  writeGuestCartToStorage,
  writeUserCartToStorage,
} from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";
import type { CartItem, CartStockStatus, ProductColor, ProductSize } from "@/lib/types";

type AddCartItemInput = {
  slug: string;
  name: string;
  image: string;
  price: number;
  color: ProductColor;
  colorName?: string;
  size: ProductSize;
  quantity?: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isHydrated: boolean;
  isCheckingStock: boolean;
  stockStatus: Record<string, CartStockStatus>;
  hasOutOfStockItems: boolean;
  hasStockMismatch: boolean;
  isUserCart: boolean;
  addItem: (item: AddCartItemInput) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  refreshStock: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

/** Persistable cart fields only — excludes ephemeral stock flags that must not re-trigger DB sync. */
function getCartSyncSignature(items: CartItem[]): string {
  return JSON.stringify(
    items.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      image: item.image,
      price: item.price,
      color: item.color,
      colorName: item.colorName ?? null,
      size: item.size,
      quantity: item.quantity,
    })),
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const [stockStatus, setStockStatus] = useState<Record<string, CartStockStatus>>({});
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedSignatureRef = useRef<string>("");
  const isHydratedRef = useRef(false);

  const performStockCheck = useCallback(async (cartItems: CartItem[]) => {
    if (cartItems.length === 0) {
      setStockStatus({});
      return;
    }

    try {
      setIsCheckingStock(true);
      const statuses = await validateCartStock(cartItems);
      setStockStatus(statuses);

      // Only rewrite cart items when live price actually changed.
      // Stock flags live in stockStatus so they don't retrigger DB sync loops.
      setItems((currentItems) => {
        let changed = false;
        const next = currentItems.map((item) => {
          const status = statuses[item.id];
          if (!status || !(status.currentPrice > 0) || status.currentPrice === item.price) {
            return item;
          }

          changed = true;
          return { ...item, price: status.currentPrice };
        });

        return changed ? next : currentItems;
      });
    } catch {
      // Keep existing stock status on failure
    } finally {
      setIsCheckingStock(false);
    }
  }, []);

  // Initial hydration: determine user status, load cart, merge guest session cart if logging in
  useEffect(() => {
    let isMounted = true;

    async function initializeCart() {
      try {
        const currentUserId = await getCurrentUserId();
        if (!isMounted) return;

        setUserId(currentUserId);

        const guestItems = readGuestCartFromStorage();

        if (currentUserId) {
          // Logged-in customer: load persistent cart from DB and local cache
          const cachedUserItems = readUserCartFromStorage(currentUserId);
          const dbItems = await loadUserCartFromDb();
          const baseUserItems = dbItems && dbItems.length > 0 ? dbItems : cachedUserItems;

          // Merge any guest session cart items into the registered account cart
          const merged = mergeCartItems(baseUserItems, guestItems);

          if (guestItems.length > 0) {
            clearGuestCartFromStorage();
          }

          if (isMounted) {
            setItems(merged);
            writeUserCartToStorage(currentUserId, merged);
            lastSyncedSignatureRef.current = getCartSyncSignature(merged);
            if (merged.length > 0) {
              void syncUserCartToDb(merged);
            }
          }

          void performStockCheck(merged);
        } else {
          // Guest customer: session-based cart
          if (isMounted) {
            setItems(guestItems);
            lastSyncedSignatureRef.current = getCartSyncSignature(guestItems);
          }
          void performStockCheck(guestItems);
        }
      } catch {
        const fallbackGuest = readGuestCartFromStorage();
        if (isMounted) {
          setItems(fallbackGuest);
          lastSyncedSignatureRef.current = getCartSyncSignature(fallbackGuest);
        }
      } finally {
        if (isMounted) {
          isHydratedRef.current = true;
          setIsHydrated(true);
        }
      }
    }

    void initializeCart();

    // Listen to Supabase auth state changes for real-time sign-in / sign-out sync
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      // Initial load is handled by initializeCart — ignore the boot SIGNED_IN event.
      if (event === "SIGNED_IN" && session?.user) {
        if (!isHydratedRef.current) {
          return;
        }

        const newUserId = session.user.id;
        setUserId(newUserId);

        const currentGuestItems = readGuestCartFromStorage();
        const dbItems = (await loadUserCartFromDb()) ?? readUserCartFromStorage(newUserId);
        const merged = mergeCartItems(dbItems, currentGuestItems);

        clearGuestCartFromStorage();
        writeUserCartToStorage(newUserId, merged);
        lastSyncedSignatureRef.current = getCartSyncSignature(merged);
        setItems(merged);
        void syncUserCartToDb(merged);
        void performStockCheck(merged);
      } else if (event === "SIGNED_OUT") {
        setUserId(null);
        clearGuestCartFromStorage();
        lastSyncedSignatureRef.current = getCartSyncSignature([]);
        setItems([]);
        setStockStatus({});
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [performStockCheck]);

  // Persist cart changes based on auth status (sessionStorage for guest, localStorage + DB for user)
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (userId) {
      // Customer: persistent across sessions
      writeUserCartToStorage(userId, items);

      const signature = getCartSyncSignature(items);
      if (signature === lastSyncedSignatureRef.current) {
        return;
      }

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(() => {
        lastSyncedSignatureRef.current = signature;
        void syncUserCartToDb(items);
      }, 500);
    } else {
      // Guest: session-based
      writeGuestCartToStorage(items);
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [items, userId, isHydrated]);

  const addItem = useCallback(
    (item: AddCartItemInput) => {
      const id = createCartItemId(item.slug, item.color, item.size);
      const addQty = Math.max(1, item.quantity ?? 1);

      setItems((current) => {
        const existingIndex = current.findIndex((cartItem) => cartItem.id === id);
        let updated: CartItem[];

        if (existingIndex >= 0) {
          const existing = current[existingIndex];
          const newQty = existing.quantity + addQty;
          updated = current.map((cartItem, idx) =>
            idx === existingIndex
              ? {
                  ...cartItem,
                  quantity: newQty,
                  image: item.image || cartItem.image,
                  price: item.price || cartItem.price,
                }
              : cartItem,
          );
        } else {
          updated = [
            ...current,
            {
              id,
              slug: item.slug,
              name: item.name,
              image: item.image,
              price: item.price,
              color: item.color,
              colorName: item.colorName,
              size: item.size,
              quantity: addQty,
            },
          ];
        }

        // Trigger stock check with updated items
        void performStockCheck(updated);
        return updated;
      });
    },
    [performStockCheck],
  );

  const updateQuantity = useCallback(
    (id: string, requestedQuantity: number) => {
      // Minimum quantity is 1 in cart; removal is handled explicitly via removeItem
      const finalRequestedQuantity = Math.max(1, requestedQuantity);

      setItems((current) => {
        const item = current.find((i) => i.id === id);
        if (!item) return current;

        const status = stockStatus[id];
        let finalQuantity = finalRequestedQuantity;

        // Cap at real-time available stock if available
        if (status && status.availableStock > 0 && finalQuantity > status.availableStock) {
          finalQuantity = status.availableStock;
        }

        return current.map((cartItem) =>
          cartItem.id === id
            ? { ...cartItem, quantity: Math.max(1, finalQuantity) }
            : cartItem,
        );
      });
    },
    [stockStatus],
  );

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    setStockStatus((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setStockStatus({});
    lastSyncedSignatureRef.current = getCartSyncSignature([]);
    if (userId) {
      writeUserCartToStorage(userId, []);
      void syncUserCartToDb([]);
    } else {
      clearGuestCartFromStorage();
    }
  }, [userId]);

  const refreshStock = useCallback(async () => {
    await performStockCheck(items);
  }, [items, performStockCheck]);

  const hasOutOfStockItems = useMemo(
    () =>
      items.some((item) => {
        const status = stockStatus[item.id];
        return status ? status.isOutOfStock : item.isOutOfStock ?? false;
      }),
    [items, stockStatus],
  );

  const hasStockMismatch = useMemo(
    () =>
      items.some((item) => {
        const status = stockStatus[item.id];
        return (
          status &&
          !status.isOutOfStock &&
          item.quantity > status.availableStock
        );
      }),
    [items, stockStatus],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount: getCartItemCount(items),
      subtotal: getCartSubtotal(items),
      isHydrated,
      isCheckingStock,
      stockStatus,
      hasOutOfStockItems,
      hasStockMismatch,
      isUserCart: Boolean(userId),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      refreshStock,
    }),
    [
      items,
      isHydrated,
      isCheckingStock,
      stockStatus,
      hasOutOfStockItems,
      hasStockMismatch,
      userId,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      refreshStock,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
