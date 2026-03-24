'use client';

import { Trash2, Plus, Minus, Package } from 'lucide-react';
import { CartItem } from '@/hooks/useCart';
import { CURRENCY } from '@/lib/utils';

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800/50 rounded-xl p-3 flex gap-3 animate-in fade-in slide-in-from-right-2 duration-200">
      <div className="w-12 h-12 bg-gray-950 rounded-lg flex items-center justify-center shrink-0">
        {item.imageUrl ? (
          <img src={item.imageUrl} className="w-full h-full object-cover rounded-lg" alt={item.name} />
        ) : (
          <Package size={20} className="text-gray-700" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h4 className="text-sm font-medium text-white truncate pr-2">{item.name}</h4>
          <button
            onClick={() => onRemove(item.id)}
            className="text-gray-600 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center bg-gray-950 border border-gray-800 rounded-lg overflow-hidden">
            <button
              onClick={() => onUpdateQuantity(item.id, item.cartQuantity - 1)}
              className="p-1.5 hover:bg-gray-800 text-gray-400"
            >
              <Minus size={12} />
            </button>
            <span className="w-8 text-center text-xs font-bold text-white">{item.cartQuantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.cartQuantity + 1)}
              className="p-1.5 hover:bg-gray-800 text-gray-400"
            >
              <Plus size={12} />
            </button>
          </div>
          <span className="font-bold text-sm text-white">
            {CURRENCY.symbol} {(item.basePrice * item.cartQuantity).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
