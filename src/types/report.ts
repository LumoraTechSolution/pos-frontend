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
  items: SalesReportItemRecord[];
}

export interface SalesReportItemRecord {
  productId: string;
  productName: string;
  sku: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
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
