import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'LKR'): string {
  const locale = currency === 'LKR' ? 'en-LK' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Centralized currency configuration.
 * Change CURRENCY_CODE to switch the entire application's currency.
 * Supported: 'LKR' (Sri Lankan Rupee) | 'USD' (US Dollar)
 */
export const CURRENCY = {
  code: 'LKR' as const,
  symbol: 'Rs.',
  locale: 'en-LK',
} as const;

/** Shorthand: format a number using the app's primary currency */
export function fc(amount: number): string {
  return formatCurrency(amount, CURRENCY.code);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Date(date).toLocaleDateString('en-US', options || defaultOptions);
}
