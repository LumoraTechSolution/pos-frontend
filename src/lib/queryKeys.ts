/**
 * Centralised React Query key constants.
 * Using these prevents typo-induced cache misses when the same logical data
 * is fetched from multiple components.
 */
export const QK = {
  branches: ['branches'] as const,
  tenantInfo: ['tenant-info'] as const,
  taxRatesActive: ['tax-rates-active'] as const,
  cashSessionActive: ['cash-session-active'] as const,
  currentSessionSales: ['current-session-sales'] as const,
  categories: ['categories'] as const,
  brands: ['brands'] as const,
  superAdmin: {
    me: ['super-admin', 'me'] as const,
  },
} as const;
