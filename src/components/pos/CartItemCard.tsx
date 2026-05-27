'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Trash2, Plus, Minus, Package, Tag } from 'lucide-react';
import { CartItem } from '@/hooks/useCart';
import { CURRENCY } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DiscountDialog } from '@/components/pos/DiscountDialog';

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onSetDiscount: (id: string, amount: number) => void;
}

export function CartItemCard({ item, onUpdateQuantity, onRemove, onSetDiscount }: CartItemCardProps) {
  const [discountOpen, setDiscountOpen] = useState(false);
  const grossLine = item.basePrice * item.cartQuantity;
  const netLine = grossLine - item.discountAmount;
  const identifier = item.sku || item.barcode;
  const hasDiscount = item.discountAmount > 0;

  return (
    <>
      <div className="bg-card border border-border/60 rounded-xl p-3 flex gap-3 animate-in fade-in slide-in-from-right-2 duration-200">
        <div className="w-14 h-14 bg-muted rounded-lg relative overflow-hidden shrink-0">
          {item.imageUrl ? (
            <Image src={item.imageUrl} fill className="object-cover rounded-lg" alt="" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
              <Package size={22} className="text-muted-foreground/60" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="min-w-0">
            <h4 className="text-sm font-medium text-foreground truncate" title={item.name}>
              {item.name}
            </h4>
            {identifier && (
              <p className="text-[11px] text-muted-foreground font-mono truncate">{identifier}</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div
              className="flex items-center bg-muted/40 border border-border rounded-lg overflow-hidden"
              role="group"
              aria-label={`Quantity for ${item.name}`}
            >
              <Button
                type="button"
                variant="ghost"
                size="touch-icon"
                onClick={() => onUpdateQuantity(item.id, item.cartQuantity - 1)}
                disabled={item.cartQuantity <= 1}
                aria-label="Decrease quantity"
                className="rounded-none hover:bg-muted"
              >
                <Minus />
              </Button>
              <span
                className="min-w-[2.25rem] text-center text-sm font-bold text-foreground tabular-nums"
                aria-live="polite"
                aria-atomic="true"
              >
                {item.cartQuantity}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="touch-icon"
                onClick={() => onUpdateQuantity(item.id, item.cartQuantity + 1)}
                aria-label="Increase quantity"
                className="rounded-none hover:bg-muted"
              >
                <Plus />
              </Button>
            </div>

            <div className="text-right">
              {hasDiscount && (
                <p className="text-[11px] text-muted-foreground line-through tabular-nums">
                  {CURRENCY.symbol} {grossLine.toFixed(2)}
                </p>
              )}
              <p className="font-bold text-base text-foreground tabular-nums whitespace-nowrap">
                {CURRENCY.symbol} {netLine.toFixed(2)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDiscountOpen(true)}
            aria-label={hasDiscount ? 'Edit discount' : 'Add discount'}
            className={
              hasDiscount
                ? 'self-start inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2 py-0.5 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                : 'self-start inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded'
            }
          >
            <Tag size={12} aria-hidden="true" />
            {hasDiscount
              ? `- ${CURRENCY.symbol} ${item.discountAmount.toFixed(2)}`
              : 'Add discount'}
          </button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="touch-icon"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.name} from cart`}
          title="Remove"
          className="self-start text-muted-foreground/70 hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 />
        </Button>
      </div>

      <DiscountDialog
        open={discountOpen}
        onOpenChange={setDiscountOpen}
        productName={item.name}
        lineSubtotal={grossLine}
        currentDiscount={item.discountAmount}
        onApply={(amount) => onSetDiscount(item.id, amount)}
      />
    </>
  );
}
