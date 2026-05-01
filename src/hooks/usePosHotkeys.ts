import { useEffect } from 'react';

/**
 * Hotkey bindings — surface these in the on-screen legend too. Keep in sync
 * with {@link HOTKEY_LEGEND} if you reorder.
 */
export const POS_SEARCH_INPUT_ID = 'pos-search-input';
export const POS_ADD_CUSTOMER_BUTTON_ID = 'pos-add-customer-button';

interface UsePosHotkeysProps {
  /** Cycle through CASH → CARD → ONLINE → CASH. */
  onCyclePaymentMethod?: () => void;
  /** Trigger the active checkout action. No-op if the cart is empty / a sale
   *  is in flight — the caller decides. */
  onCheckout?: () => void;
  /** Re-print the last completed sale's receipt. */
  onPrintLastReceipt?: () => void;
  /** Disable while a modal is open or the terminal isn't ready. */
  disabled?: boolean;
}

/**
 * Global F-key shortcuts for the POS terminal:
 *  - F2  Focus the product search / barcode input
 *  - F3  Open the customer-add panel
 *  - F4  Cycle payment method
 *  - F9  Checkout
 *  - F12 Print last receipt (overrides browser DevTools)
 *
 * F-keys are deliberately chosen because they don't collide with typing in any
 * input — cashiers can hit them mid-flow without focus context.
 */
export function usePosHotkeys({
  onCyclePaymentMethod,
  onCheckout,
  onPrintLastReceipt,
  disabled = false,
}: UsePosHotkeysProps) {
  useEffect(() => {
    if (disabled) return;

    const handler = (e: KeyboardEvent) => {
      // Bail on synthetic events that don't carry a key (autofill, IME, etc.)
      if (typeof e.key !== 'string') return;

      switch (e.key) {
        case 'F2': {
          e.preventDefault();
          const el = document.getElementById(POS_SEARCH_INPUT_ID) as HTMLInputElement | null;
          el?.focus();
          el?.select();
          return;
        }
        case 'F3': {
          e.preventDefault();
          const el = document.getElementById(POS_ADD_CUSTOMER_BUTTON_ID) as HTMLButtonElement | null;
          el?.click();
          return;
        }
        case 'F4': {
          e.preventDefault();
          onCyclePaymentMethod?.();
          return;
        }
        case 'F9': {
          e.preventDefault();
          onCheckout?.();
          return;
        }
        case 'F12': {
          // Steal F12 from the browser's DevTools default — cashiers need
          // re-print on this key (most thermal POS software binds F12 to
          // "reprint last receipt" by convention).
          e.preventDefault();
          onPrintLastReceipt?.();
          return;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCyclePaymentMethod, onCheckout, onPrintLastReceipt, disabled]);
}

export const HOTKEY_LEGEND: { key: string; label: string }[] = [
  { key: 'F2', label: 'Search' },
  { key: 'F3', label: 'Customer' },
  { key: 'F4', label: 'Payment' },
  { key: 'F9', label: 'Checkout' },
  { key: 'F12', label: 'Reprint' },
];
