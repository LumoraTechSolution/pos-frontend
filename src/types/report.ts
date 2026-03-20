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

export interface EmployeePerformanceRecord {
  userId: string;
  employeeName: string;
  email: string;
  transactionCount: number;
  totalRevenue: number;
  avgTransactionValue: number;
  totalDiscount: number;
}

export interface TopCustomerRecord {
  customerId: string;
  customerName: string;
  email: string;
  phone: string;
  transactionCount: number;
  totalSpent: number;
  loyaltyPoints: number;
}

export interface TaxLineItem {
  paymentMethod: string;
  transactionCount: number;
  taxCollected: number;
  grossRevenue: number;
}

export interface TaxSummaryReport {
  totalTaxCollected: number;
  totalTransactions: number;
  breakdown: TaxLineItem[];
}

export interface ProductProfitRecord {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  unitsSold: number;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  marginPct: number;
}

export interface ProfitabilityReport {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  overallMarginPct: number;
  products: import("./common").Page<ProductProfitRecord>;
}
