import api from "./api";
import { ApiResponse, PageResponse } from "@/types/common";
import { SalesReportRecord, InventoryValuationReport } from "@/types/report";

/**
 * Reporting service
 */
export const reportService = {
  /**
   * Get sales report for a date range
   */
  getSalesReport: (start: string, end: string, page = 0, size = 20) =>
    api
      .get<ApiResponse<PageResponse<SalesReportRecord>>>("/reports/sales", {
        params: { start, end, page, size },
      })
      .then((res) => res.data.data),

  /**
   * Get current inventory valuation
   */
  getInventoryValuation: () =>
    api
      .get<ApiResponse<InventoryValuationReport>>("/reports/inventory-valuation")
      .then((res) => res.data.data),
};
