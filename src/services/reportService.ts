import api from "./api";
import { ApiResponse, Page } from "@/types/common";
import {
  SalesReportRecord,
  InventoryValuationReport,
  EmployeePerformanceRecord,
  TopCustomerRecord,
  TaxSummaryReport,
  ProfitabilityReport,
} from "@/types/report";

/**
 * Reporting service
 */
export const reportService = {
  getSalesReport: (start: string, end: string, page = 0, size = 20) =>
    api
      .get<ApiResponse<Page<SalesReportRecord>>>("/reports/sales", {
        params: { start, end, page, size },
      })
      .then((res) => res.data.data),

  getInventoryValuation: () =>
    api
      .get<ApiResponse<InventoryValuationReport>>("/reports/inventory-valuation")
      .then((res) => res.data.data),

  getEmployeePerformance: (start: string, end: string, page = 0, size = 20) =>
    api
      .get<ApiResponse<Page<EmployeePerformanceRecord>>>("/reports/employee-performance", {
        params: { start, end, page, size },
      })
      .then((res) => res.data.data),

  getTopCustomers: (page = 0, size = 20) =>
    api
      .get<ApiResponse<Page<TopCustomerRecord>>>("/reports/top-customers", {
        params: { page, size },
      })
      .then((res) => res.data.data),

  getTaxSummary: (start: string, end: string) =>
    api
      .get<ApiResponse<TaxSummaryReport>>("/reports/tax-summary", {
        params: { start, end },
      })
      .then((res) => res.data.data),

  getProfitabilityReport: (start: string, end: string, page = 0, size = 20) =>
    api
      .get<ApiResponse<ProfitabilityReport>>("/reports/profitability", {
        params: { start, end, page, size },
      })
      .then((res) => res.data.data),
};
