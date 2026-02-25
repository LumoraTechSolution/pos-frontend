/**
 * Reporting module types
 */

export interface SalesReportRecord {
  saleId: string;
  invoiceNumber: string;
  createdAt: string;
  customerName: string;
  cashierName: string;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  netAmount: number;
  paymentMethod: string;
  paymentStatus: string;
}

export interface InventoryValuationReport {
  totalProducts: number;
  totalStockItems: number;
  totalCostValue: number;
  totalRetailValue: number;
  potentialProfit: number;
  categoryBreakdown: CategoryValuation[];
}

export interface CategoryValuation {
  categoryName: string;
  productCount: number;
  stockCount: number;
  costValue: number;
  retailValue: number;
}
