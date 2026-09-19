import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type CartContextValue = {
  cart: Record<number, number>;
  cartCount: number;
  changeQuantity: (id: number, amount: number) => void;
  removeFromCart: (id: number) => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Record<number, number>>({});
  const cartCount = useMemo(() => Object.values(cart).reduce((sum, quantity) => sum + quantity, 0), [cart]);

  const changeQuantity = (id: number, amount: number) => {
    setCart((current) => {
      const quantity = Math.max(0, (current[id] ?? 0) + amount);
      const next = { ...current };
      if (quantity === 0) delete next[id];
      else next[id] = quantity;
      return next;
    });
  };

  const removeFromCart = (id: number) => {
    setCart((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  return <CartContext.Provider value={{ cart, cartCount, changeQuantity, removeFromCart }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}