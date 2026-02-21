import api from "./api";
import { ApiResponse } from "@/types/common";

export interface SaleItemRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
}

export interface SaleRequest {
  customerId?: string;
  paymentMethod: 'CASH' | 'CARD' | 'ONLINE' | 'SPLIT' | 'CREDIT';
  items: SaleItemRequest[];
}

export interface SaleItemResponse {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface SaleResponse {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  netAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  items: SaleItemResponse[];
}

export interface SalesSummaryResponse {
  totalOrders: number;
  totalGrossSales: number;
  totalTax: number;
  totalDiscounts: number;
  totalNetSales: number;
  salesByPaymentMethod: Record<string, number>;
}

export const salesService = {
  createSale: (data: SaleRequest) => 
    api.post<ApiResponse<SaleResponse>>("/sales", data).then(res => res.data.data),
  
  getSale: (id: string) => 
    api.get<ApiResponse<SaleResponse>>(`/sales/${id}`).then(res => res.data.data),

  getDailySummary: () =>
    api.get<ApiResponse<SalesSummaryResponse>>("/sales/summary/daily").then(res => res.data.data),
};
