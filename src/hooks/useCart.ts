import { useState, useCallback, useMemo } from 'react';
import { Product } from '@/types/inventory';
import { toast } from 'sonner';
import { TaxRate } from '@/services/taxService';
import { Category } from '@/types/inventory';

export interface CartItem extends Product {
  cartQuantity: number;
}

export interface TaxContext {
  taxRates: TaxRate[];
  categories: Category[];
}

/**
 * Resolves the tax rate for a product using the chain:
 * Product → Category → category.taxRateId → taxRate.rate
 * Fallback → Default tax rate
 * Fallback → 0 (tax-exempt)
 */
function getProductTaxRate(product: Product, taxContext: TaxContext | null): number {
  if (!taxContext || taxContext.taxRates.length === 0) return 0;

  const { taxRates, categories } = taxContext;

  // 1. Find the product's category
  if (product.categoryId) {
    const category = categories.find(c => c.id === product.categoryId);
    if (category?.taxRateId) {
      // 2. Find the tax rate assigned to this category
      const categoryTax = taxRates.find(t => t.id === category.taxRateId && t.isActive);
      if (categoryTax) return categoryTax.rate;
    }
  }

  // 3. Fallback to default tax rate
  const defaultTax = taxRates.find(t => t.isDefault && t.isActive);
  if (defaultTax) return defaultTax.rate;

  // 4. No tax (tax-exempt)
  return 0;
}

export const useCart = (taxContext: TaxContext | null = null) => {
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

  // Dynamic per-item tax calculation & metadata
  const taxInfo = useMemo(() => {
    const itemTaxes = items.map(item => {
      const rate = getProductTaxRate(item, taxContext);
      
      // Get the name for labeling
      let name = 'Tax';
      if (taxContext) {
        const { taxRates, categories } = taxContext;
        const category = categories.find(c => c.id === item.categoryId);
        const resolvedTax = taxRates.find(t => 
          (category?.taxRateId === t.id) || (t.isDefault)
        );
        name = resolvedTax?.name || 'Tax';
      }

      return { rate, name, amount: item.basePrice * item.cartQuantity * rate };
    });

    const totalAmount = itemTaxes.reduce((sum, t) => sum + t.amount, 0);
    
    // Determine the label
    let label = 'Tax';
    if (items.length > 0) {
      const uniqueRates = new Set(itemTaxes.map(t => t.rate));
      if (uniqueRates.size === 1) {
        const rate = Array.from(uniqueRates)[0];
        const names = Array.from(new Set(itemTaxes.map(t => t.name)));
        const name = names.length === 1 ? names[0] : 'Tax';
        label = `${name} (${(rate * 100).toFixed(0)}%)`;
      } else {
        label = 'Combined Tax';
      }
    } else {
      // Fallback to default tax for empty cart preview
      const defaultTax = taxContext?.taxRates.find(t => t.isDefault && t.isActive);
      if (defaultTax) {
        label = `${defaultTax.name} (${(defaultTax.rate * 100).toFixed(0)}%)`;
      }
    }

    return { totalAmount, label };
  }, [items, taxContext]);

  const total = useMemo(() => subtotal + taxInfo.totalAmount, [subtotal, taxInfo.totalAmount]);

  return {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    taxAmount: taxInfo.totalAmount,
    taxLabel: taxInfo.label,
    total,
    itemCount: items.reduce((sum, item) => sum + item.cartQuantity, 0),
  };
};
