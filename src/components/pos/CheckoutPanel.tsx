'use client';

import { ShoppingCart, CreditCard, Banknote, QrCode, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PaymentMethod = 'CASH' | 'CARD' | 'ONLINE';

interface CheckoutPanelProps {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
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
  { method: 'CASH', icon: Banknote, label: 'Cash' },
  { method: 'CARD', icon: CreditCard, label: 'Card' },
  { method: 'ONLINE', icon: QrCode, label: 'Online' },
];

export function CheckoutPanel({
  paymentMethod,
  onPaymentMethodChange,
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
  return (
    <div className="bg-gray-900/60 border-t border-gray-800 p-6 space-y-5">
      {/* Payment Method Selector */}
      <div className="grid grid-cols-3 gap-2">
        {PAYMENT_OPTIONS.map(({ method, icon: Icon, label }) => (
          <button
            key={method}
            onClick={() => onPaymentMethodChange(method)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
              paymentMethod === method
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-gray-950 border-gray-800 text-gray-500 hover:bg-gray-800'
            }`}
          >
            <Icon size={18} className="mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
          </button>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="text-gray-300 font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{taxLabel}</span>
          <span className="text-gray-300 font-medium">${taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-2xl font-black pt-3 border-t border-gray-800/50">
          <span className="text-white">TOTAL</span>
          <span className="text-indigo-400">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Complete Sale Button */}
      <Button
        onClick={onCheckout}
        className="w-full h-16 bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 text-white font-bold text-xl rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none group"
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
