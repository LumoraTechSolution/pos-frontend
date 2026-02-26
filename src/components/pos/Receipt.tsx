'use client';

import React, { forwardRef } from 'react';
import { SaleResponse } from '@/services/salesService';

interface ReceiptProps {
  sale: SaleResponse | null;
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ sale }, ref) => {
  if (!sale) return null;

  return (
    <div ref={ref} className="p-4 bg-white text-black font-mono text-[12px] w-[80mm]">
      <div className="text-center mb-4">
        <h1 className="text-lg font-bold uppercase">Lumora POS</h1>
        <p>123 Business Avenue</p>
        <p>City, State, 12345</p>
        <p>Tel: +1 (555) 123-4567</p>
      </div>

      <div className="border-t border-b border-black py-2 mb-2">
        <p className="flex justify-between">
          <span>Date:</span>
          <span>{new Date(sale.createdAt).toLocaleString()}</span>
        </p>
        <p className="flex justify-between">
          <span>Invoice #:</span>
          <span>{sale.invoiceNumber}</span>
        </p>
        <p className="flex justify-between">
          <span>Method:</span>
          <span>{sale.paymentMethod}</span>
        </p>
      </div>

      <div className="mb-4">
        <p className="font-bold border-b border-black pb-1 mb-1">Items</p>
        {sale.items.map((item, index) => (
          <div key={index} className="mb-1">
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <span className="truncate">{item.productName}</span>
              <span className="text-right">${(item.unitPrice * item.quantity).toFixed(2)}</span>
            </div>
            <div className="text-[10px] text-gray-600">
              {item.quantity} x ${item.unitPrice.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-black pt-2 space-y-1">
        <p className="flex justify-between">
          <span>Subtotal:</span>
          <span>${sale.totalAmount.toFixed(2)}</span>
        </p>
        <p className="flex justify-between">
          <span>Tax (10%):</span>
          <span>${sale.taxAmount.toFixed(2)}</span>
        </p>
        {sale.discountAmount > 0 && (
          <p className="flex justify-between">
            <span>Discount:</span>
            <span>-${sale.discountAmount.toFixed(2)}</span>
          </p>
        )}
        <p className="flex justify-between font-bold text-base border-t border-black pt-1">
          <span>TOTAL:</span>
          <span>${sale.netAmount.toFixed(2)}</span>
        </p>
      </div>

      <div className="text-center mt-6">
        <p className="font-bold">Thank you for your purchase!</p>
        <p className="text-[10px]">Please keep your receipt for any returns.</p>
        <div className="mt-4 opacity-50">
          * * * END OF RECEIPT * * *
        </div>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';
