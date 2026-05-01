'use client';

import { ShoppingCart, CreditCard, Banknote, QrCode, SplitSquareHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CURRENCY } from '@/lib/utils';

export type PaymentMethod = 'CASH' | 'CARD' | 'ONLINE' | 'SPLIT';

interface CheckoutPanelProps {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  cashTendered: number;
  onCashTenderedChange: (amount: number) => void;
  subtotal: number;
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

export function CheckoutPanel({
  paymentMethod,
  onPaymentMethodChange,
  cashTendered,
  onCashTenderedChange,
  subtotal,
  taxAmount,
  taxLabel = 'Tax',
  total,
  itemCount,
  isProcessing,
  onCheckout,
  onHoldSale,
  onDiscard,
}: CheckoutPanelProps) {
  const cashChange = paymentMethod === 'CASH' && cashTendered > total ? cashTendered - total : 0;

  return (
    <div className="bg-gray-900/60 border-t border-gray-800 p-6 space-y-5">
      {/* Payment Method Selector */}
      <div className="grid grid-cols-4 gap-2">
        {PAYMENT_OPTIONS.map(({ method, icon: Icon, label }) => (
          <button
            key={method}
            onClick={() => onPaymentMethodChange(method)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
              paymentMethod === method
                ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-gray-950 border-gray-800 text-gray-500 hover:bg-gray-800'
            }`}
          >
            <Icon size={18} className="mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
          </button>
        ))}
      </div>

      {/* Cash tendered input — shown for CASH (optional) and SPLIT (required) */}
      {(paymentMethod === 'CASH' || paymentMethod === 'SPLIT') && (
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium">
            {paymentMethod === 'SPLIT' ? 'Cash portion' : 'Cash tendered (optional)'}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">{CURRENCY.symbol}</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={cashTendered || ''}
              onChange={(e) => onCashTenderedChange(parseFloat(e.target.value) || 0)}
              placeholder={paymentMethod === 'SPLIT' ? 'Enter cash amount' : total.toFixed(2)}
              className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {paymentMethod === 'SPLIT' && cashTendered > 0 && (
            <p className="text-xs text-gray-500">
              Card / other: {CURRENCY.symbol} {Math.max(0, total - cashTendered).toFixed(2)}
            </p>
          )}
          {paymentMethod === 'CASH' && cashChange > 0 && (
            <p className="text-xs text-emerald-400 font-medium">
              Change due: {CURRENCY.symbol} {cashChange.toFixed(2)}
            </p>
          )}
        </div>
      )}

      {/* Totals */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="text-gray-300 font-medium">{CURRENCY.symbol} {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{taxLabel}</span>
          <span className="text-gray-300 font-medium">{CURRENCY.symbol} {taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-2xl font-black pt-3 border-t border-gray-800/50">
          <span className="text-white">TOTAL</span>
          <span className="text-primary">{CURRENCY.symbol} {total.toFixed(2)}</span>
        </div>
      </div>

      {/* Complete Sale Button */}
      <Button
        onClick={onCheckout}
        className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xl rounded-2xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none group"
        disabled={itemCount === 0 || isProcessing}
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin" size={20} /> PROCESSING...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            COMPLETE SALE <ShoppingCart size={20} className="group-hover:translate-x-1 transition-transform" />
          </span>
        )}
      </Button>

      {/* Hold / Discard */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 bg-transparent border-gray-800 text-gray-400 hover:bg-gray-800 h-10 rounded-xl"
          onClick={onHoldSale}
        >
          Hold Sale
        </Button>
        <Button
          variant="outline"
          className="flex-1 bg-transparent border-red-900/10 text-red-500/50 hover:bg-red-950/20 hover:text-red-400 h-10 rounded-xl"
          onClick={onDiscard}
        >
          Discard
        </Button>
      </div>
    </div>
  );
}
