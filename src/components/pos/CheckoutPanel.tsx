'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart, CreditCard, Banknote, QrCode, SplitSquareHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NumberPad } from '@/components/ui/number-pad';
import { QuickTenderButtons } from '@/components/ui/quick-tender-buttons';
import { CURRENCY } from '@/lib/utils';
import { cn } from '@/lib/utils';

export type PaymentMethod = 'CASH' | 'CARD' | 'ONLINE' | 'SPLIT';

interface CheckoutPanelProps {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  cashTendered: number;
  onCashTenderedChange: (amount: number) => void;
  subtotal: number;
  discountAmount?: number;
  taxAmount: number;
  taxLabel?: string;
  total: number;
  itemCount: number;
  isProcessing: boolean;
  onCheckout: () => void;
  onHoldSale: () => void;
  onDiscard: () => void;
}

const PAYMENT_OPTIONS: { method: PaymentMethod; icon: typeof Banknote; label: string }[] = [
  { method: 'CASH',   icon: Banknote,              label: 'Cash' },
  { method: 'CARD',   icon: CreditCard,            label: 'Card' },
  { method: 'ONLINE', icon: QrCode,                label: 'Online' },
  { method: 'SPLIT',  icon: SplitSquareHorizontal, label: 'Split' },
];

const TENDER_PRESETS = [100, 500, 1000, 2000, 5000];

export function CheckoutPanel({
  paymentMethod,
  onPaymentMethodChange,
  cashTendered,
  onCashTenderedChange,
  subtotal,
  discountAmount = 0,
  taxAmount,
  taxLabel = 'Tax',
  total,
  itemCount,
  isProcessing,
  onCheckout,
  onHoldSale,
  onDiscard,
}: CheckoutPanelProps) {
  const [cashStr, setCashStr] = useState(cashTendered > 0 ? String(cashTendered) : '');

  useEffect(() => {
    if (cashTendered === 0) setCashStr('');
    else if (cashTendered !== parseFloat(cashStr)) setCashStr(String(cashTendered));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cashTendered]);

  const updateCash = (next: string) => {
    setCashStr(next);
    onCashTenderedChange(parseFloat(next) || 0);
  };

  const setTender = (amount: number) => updateCash(amount.toFixed(2));

  const cashChange =
    paymentMethod === 'CASH' && cashTendered > total ? cashTendered - total : 0;
  const cashShort =
    paymentMethod === 'CASH' && cashTendered > 0 && cashTendered < total
      ? total - cashTendered
      : 0;
  const showCashFlow = paymentMethod === 'CASH' || paymentMethod === 'SPLIT';

  return (
    <div className="bg-card/60 border-t border-border p-4 sm:p-5 space-y-4">
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-2"
        role="radiogroup"
        aria-label="Payment method"
      >
        {PAYMENT_OPTIONS.map(({ method, icon: Icon, label }) => {
          const isSelected = paymentMethod === method;
          return (
            <button
              key={method}
              role="radio"
              aria-checked={isSelected}
              onClick={() => onPaymentMethodChange(method)}
              className={cn(
                'flex flex-col items-center justify-center min-h-touch p-3 rounded-xl border transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSelected
                  ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon size={20} className="mb-1" aria-hidden="true" />
              <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
            </button>
          );
        })}
      </div>

      {showCashFlow && (
        <div className="space-y-3 rounded-xl border border-border bg-background/40 p-3">
          <div className="flex items-baseline justify-between">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {paymentMethod === 'SPLIT' ? 'Cash portion' : 'Cash tendered'}
            </label>
            <div className="text-lg font-bold text-foreground tabular-nums">
              {CURRENCY.symbol} {(cashTendered || 0).toFixed(2)}
            </div>
          </div>

          <QuickTenderButtons
            total={total}
            presets={TENDER_PRESETS}
            onTender={setTender}
          />

          <details className="group">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none list-none [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-1">
                <span className="group-open:rotate-90 transition-transform">&gt;</span>
                Number pad
              </span>
            </summary>
            <div className="pt-3">
              <NumberPad value={cashStr} onChange={updateCash} />
              {cashStr && (
                <button
                  type="button"
                  onClick={() => updateCash('')}
                  className="mt-2 text-xs text-muted-foreground hover:text-destructive underline-offset-2 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </details>

          {paymentMethod === 'SPLIT' && cashTendered > 0 && (
            <div className="flex items-baseline justify-between text-sm border-t border-border pt-2">
              <span className="text-muted-foreground">Remaining (card / other)</span>
              <span className="font-semibold text-foreground tabular-nums">
                {CURRENCY.symbol} {Math.max(0, total - cashTendered).toFixed(2)}
              </span>
            </div>
          )}
          {cashChange > 0 && (
            <div className="flex items-baseline justify-between rounded-lg bg-success/10 px-3 py-2 border border-success/20">
              <span className="text-sm font-semibold text-success uppercase tracking-wider">Change due</span>
              <span className="text-xl font-bold text-success tabular-nums">
                {CURRENCY.symbol} {cashChange.toFixed(2)}
              </span>
            </div>
          )}
          {cashShort > 0 && (
            <div className="flex items-baseline justify-between rounded-lg bg-warning/10 px-3 py-2 border border-warning/20">
              <span className="text-sm font-semibold text-warning uppercase tracking-wider">Short by</span>
              <span className="text-base font-bold text-warning tabular-nums">
                {CURRENCY.symbol} {cashShort.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground/90 font-medium tabular-nums">{CURRENCY.symbol} {subtotal.toFixed(2)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-destructive">Discount</span>
            <span className="text-destructive font-medium tabular-nums">- {CURRENCY.symbol} {discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{taxLabel}</span>
          <span className="text-foreground/90 font-medium tabular-nums">{CURRENCY.symbol} {taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-baseline text-2xl font-black pt-3 border-t border-border">
          <span className="text-foreground">TOTAL</span>
          <span className="text-primary tabular-nums">{CURRENCY.symbol} {total.toFixed(2)}</span>
        </div>
      </div>

      <Button
        onClick={onCheckout}
        className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xl rounded-2xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none group focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        disabled={itemCount === 0 || isProcessing}
        aria-label={`Complete sale, total ${CURRENCY.symbol} ${total.toFixed(2)}`}
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin" size={20} aria-hidden="true" /> PROCESSING...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            COMPLETE SALE
            <ShoppingCart size={20} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </span>
        )}
      </Button>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 min-h-touch rounded-xl"
          onClick={onHoldSale}
        >
          Hold Sale
        </Button>
        <Button
          variant="outline"
          className="flex-1 min-h-touch rounded-xl border-destructive/30 text-red-400 hover:bg-destructive/10 hover:text-red-300"
          onClick={onDiscard}
        >
          Discard
        </Button>
      </div>
    </div>
  );
}
