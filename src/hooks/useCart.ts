import { useState, useCallback, useMemo } from 'react';
import { Product } from '@/types/inventory';
import { toast } from 'sonner';

export interface CartItem extends Product {
  cartQuantity: number;
}

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: Product) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      
      if (existingItem) {
        if (existingItem.cartQuantity >= product.stockQuantity) {
          toast.error(`Only ${product.stockQuantity} items available in stock`);
          return prevItems;
        }
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        );
      }

      if (product.stockQuantity <= 0) {
        toast.error("Product out of stock");
        return prevItems;
      }

      return [...prevItems, { ...product, cartQuantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prevItems) => {
      const item = prevItems.find(i => i.id === productId);
      if (item && quantity > item.stockQuantity) {
        toast.error(`Only ${item.stockQuantity} items available in stock`);
        return prevItems;
      }
      return prevItems.map((i) =>
        i.id === productId ? { ...i, cartQuantity: quantity } : i
      );
    });
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.basePrice * item.cartQuantity, 0);
  }, [items]);

  const taxRate = 0.1; // 10% tax
  const taxAmount = useMemo(() => subtotal * taxRate, [subtotal]);
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  return {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    taxAmount,
    total,
    itemCount: items.reduce((sum, item) => sum + item.cartQuantity, 0),
  };
};
