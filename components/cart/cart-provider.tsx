"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createCartItemId,
  getCartItemCount,
  getCartSubtotal,
  readCartFromStorage,
  writeCartToStorage,
} from "@/lib/cart";
import type { CartItem, ProductColor, ProductSize } from "@/lib/types";

type AddCartItemInput = {
  slug: string;
  name: string;
  image: string;
  price: number;
  color: ProductColor;
  size: ProductSize;
  quantity?: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isHydrated: boolean;
  addItem: (item: AddCartItemInput) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setItems((current) =>
      current.length > 0 ? current : readCartFromStorage(),
    );
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      writeCartToStorage(items);
    }
  }, [items, isHydrated]);

  const addItem = useCallback((item: AddCartItemInput) => {
    const id = createCartItemId(item.slug, item.color, item.size);
    const quantity = item.quantity ?? 1;

    setItems((current) => {
      const existing = current.find((cartItem) => cartItem.id === id);

      if (existing) {
        return current.map((cartItem) =>
          cartItem.id === id
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem,
        );
      }

      return [
        ...current,
        {
          id,
          slug: item.slug,
          name: item.name,
          image: item.image,
          price: item.price,
          color: item.color,
          size: item.size,
          quantity,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) {
      setItems((current) => current.filter((item) => item.id !== id));
      return;
    }

    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, quantity } : item)),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({
      items,
      itemCount: getCartItemCount(items),
      subtotal: getCartSubtotal(items),
      isHydrated,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [items, isHydrated, addItem, updateQuantity, removeItem, clearCart],
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
