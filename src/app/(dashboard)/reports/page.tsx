"use client";

import { useState, Fragment } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { reportService } from "@/services/reportService";
import { returnService, ReturnResponse, ReturnItemRequest } from "@/services/returnService";
import {
  SalesReportRecord,
  InventoryValuationReport,
  EmployeePerformanceRecord,
  TopCustomerRecord,
  TaxSummaryReport,
  TaxLineItem,
  ProfitabilityReport,
  ProductProfitRecord,
} from "@/types/report";
import { Page } from "@/types/common";
import { format } from "date-fns";
import {
  FileText,
  TrendingUp,
  Calendar,
  Download,
  ArrowRight,
  PieChart,
  DollarSign,
  Users,
  Receipt,
  BarChart3,
  Star,
  Percent,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { ReturnModal } from "@/components/pos/ReturnModal";
import { ExchangeModal } from "@/components/pos/ExchangeModal";
import { RotateCcw, ShieldCheck, ShieldAlert, ChevronRight, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Pagination } from "@/components/ui/pagination";
import { FeatureGuard } from "@/components/auth/FeatureGuard";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

export default function ReportsPage() {
  const { user } = useAuthStore();
  // Action states
  const [activeTab, setActiveTab] = useState("sales");
  const [returnSaleId, setReturnSaleId] = useState<string | null>(null);
  const [exchangeData, setExchangeData] = useState<{ saleId: string; returnItems: ReturnItemRequest[]; returnCredit: number } | null>(null);

  // Pagination states
  const [salesPage, setSalesPage] = useState(0);
  const [returnsPage, setReturnsPage] = useState(0);
  const [employeePage, setEmployeePage] = useState(0);
  const [customersPage, setCustomersPage] = useState(0);
  const [profitPage, setProfitPage] = useState(0);
  const pageSize = 15;

  // Expanded rows state
  const [expandedSales, setExpandedSales] = useState<Record<string, boolean>>({});
  const [expandedReturns, setExpandedReturns] = useState<Record<string, boolean>>({});

  const toggleSaleExpanded = (id: string) => setExpandedSales(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleReturnExpanded = (id: string) => setExpandedReturns(prev => ({ ...prev, [id]: !prev[id] }));

  const [dateRange, setDateRange] = useState({
    start: format(new Date(new Date().setDate(new Date().getDate() - 7)), "yyyy-MM-dd'T'00:00:00"),
    end: format(new Date(), "yyyy-MM-dd'T'23:59:59"),
  });

  const { data: salesData, isLoading: salesLoading } = useQuery<Page<SalesReportRecord>>({
    queryKey: ["reports", "sales", dateRange, salesPage],
    queryFn: () => reportService.getSalesReport(dateRange.start, dateRange.end, salesPage, pageSize),
  });

  const { data: returnsData, isLoading: returnsLoading, refetch: refetchReturns } = useQuery<Page<ReturnResponse>>({
    queryKey: ["reports", "returns", returnsPage],
    queryFn: () => returnService.getAllReturns({ page: returnsPage, size: pageSize }),
  });

  const { data: valuationData, isLoading: valuationLoading } = useQuery<InventoryValuationReport>({
    queryKey: ["reports", "valuation"],
    queryFn: reportService.getInventoryValuation,
  });

  const { data: employeeData, isLoading: employeeLoading } = useQuery<Page<EmployeePerformanceRecord>>({
    queryKey: ["reports", "employee-performance", dateRange, employeePage],
    queryFn: () => reportService.getEmployeePerformance(dateRange.start, dateRange.end, employeePage, pageSize),
  });

  const { data: topCustomersData, isLoading: topCustomersLoading } = useQuery<Page<TopCustomerRecord>>({
    queryKey: ["reports", "top-customers", customersPage],
    queryFn: () => reportService.getTopCustomers(customersPage, pageSize),
  });

  const { data: taxData, isLoading: taxLoading } = useQuery<TaxSummaryReport>({
    queryKey: ["reports", "tax-summary", dateRange],
    queryFn: () => reportService.getTaxSummary(dateRange.start, dateRange.end),
  });

  const { data: profitData, isLoading: profitLoading } = useQuery<ProfitabilityReport>({
    queryKey: ["reports", "profitability", dateRange, profitPage],
    queryFn: () => reportService.getProfitabilityReport(dateRange.start, dateRange.end, profitPage, pageSize),
  });

  const approveReturnMutation = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => returnService.approveReturn(id, approve),
    onSuccess: () => {
      refetchReturns();
    }
  });

  // ─── Data Prep for Charts ───────────────────────────────────────────────
  const salesChartData = (salesData?.content || [])
    .slice()
    .reverse()
    .map(s => ({
      name: format(new Date(s.createdAt), "MM/dd HH:mm"),
      amount: s.netAmount
    }));

  const profitChartData = (profitData?.products.content || [])
    .slice(0, 10)
    .map(p => ({
      name: p.productName.length > 12 ? p.productName.substring(0, 12) + "..." : p.productName,
      profit: p.grossProfit,
      revenue: p.revenue
    }));

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

  // ─── Universal Export (CSV) ─────────────────────────────────────────────
  const exportData = () => {
    let headers: string[] = [];
    let dataRows: unknown[][] = [];
    const filename = `report-${activeTab}-${format(new Date(), "yyyyMMdd")}.csv`;

    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    if (activeTab === "sales" && salesData?.content) {
      headers = ["Invoice #", "Date", "Customer", "Cashier", "Payment", "Status", "Total", "Tax", "Net"];
      dataRows = salesData.content.map(s => [
        escape(s.invoiceNumber), escape(format(new Date(s.createdAt), "yyyy-MM-dd HH:mm")),
        escape(s.customerName), escape(s.cashierName), escape(s.paymentMethod),
        escape(s.paymentStatus), escape(s.totalAmount), escape(s.taxAmount), escape(s.netAmount)
      ]);
    } else if (activeTab === "returns" && returnsData?.content) {
      headers = ["Return #", "Date", "Reason", "Processed By", "Status", "Refund Amount"];
      dataRows = returnsData.content.map(ret => [
        escape(ret.returnNumber), escape(format(new Date(ret.createdAt), "yyyy-MM-dd HH:mm")),
        escape(ret.reason), escape(ret.processedByName), escape(ret.status), escape(ret.refundAmount)
      ]);
    } else if (activeTab === "inventory" && valuationData?.categoryBreakdown) {
      headers = ["Category", "Products", "Stock", "Cost Value", "Retail Value", "Profit"];
      dataRows = valuationData.categoryBreakdown.map(cat => [
        escape(cat.categoryName), escape(cat.productCount), escape(cat.stockCount),
        escape(cat.costValue), escape(cat.retailValue), escape(cat.retailValue - cat.costValue)
      ]);
    } else if (activeTab === "employees" && employeeData?.content) {
      headers = ["Employee", "Email", "Transactions", "Revenue", "Avg Basket", "Discounts"];
      dataRows = employeeData.content.map((emp: EmployeePerformanceRecord) => [
        escape(emp.employeeName), escape(emp.email), escape(emp.transactionCount),
        escape(emp.totalRevenue), escape(emp.avgTransactionValue), escape(emp.totalDiscount)
      ]);
    } else if (activeTab === "customers" && topCustomersData?.content) {
      headers = ["Customer", "Email", "Phone", "Visits", "Total Spent", "Loyalty Points"];
      dataRows = topCustomersData.content.map((cust: TopCustomerRecord) => [
        escape(cust.customerName), escape(cust.email), escape(cust.phone),
        escape(cust.transactionCount), escape(cust.totalSpent), escape(cust.loyaltyPoints)
      ]);
    } else if (activeTab === "tax" && taxData?.breakdown) {
      headers = ["Payment Method", "Transactions", "Gross Revenue", "Tax Collected"];
      dataRows = taxData.breakdown.map(tax => [
        escape(tax.paymentMethod), escape(tax.transactionCount), escape(tax.grossRevenue), escape(tax.taxCollected)
      ]);
    } else if (activeTab === "profitability" && profitData?.products.content) {
      headers = ["Product", "SKU", "Category", "Units Sold", "Revenue", "COGS", "Profit", "Margin %"];
      dataRows = profitData.products.content.map(p => [
        escape(p.productName), escape(p.sku), escape(p.category), escape(p.unitsSold),
        escape(p.revenue), escape(p.costOfGoodsSold), escape(p.grossProfit), escape(p.marginPct)
      ]);
    }

    if (dataRows.length === 0) return;

    const csvContent = [headers.join(","), ...dataRows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── PDF Print (uses browser's native print dialog) ──────────────────────
  const printPDF = () => {
    const rows = salesData?.content ?? [];
    const tableRows = rows
      .map(
        (s) => `
        <tr>
          <td>${s.invoiceNumber}</td>
          <td>${format(new Date(s.createdAt), "MMM dd, yyyy HH:mm")}</td>
          <td>${s.customerName}</td>
          <td>${s.cashierName}</td>
          <td>${s.paymentMethod}</td>
          <td>${s.paymentStatus}</td>
          <td style="text-align:right">${formatCurrency(s.netAmount)}</td>
        </tr>`
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Report — ${dateRange.start.split("T")[0]} to ${dateRange.end.split("T")[0]}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; color: #000; margin: 24px; }
            h1 { font-size: 18px; margin-bottom: 4px; }
            p  { color: #555; margin-bottom: 16px; font-size: 11px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f0f0f0; text-align: left; padding: 8px 10px; border-bottom: 2px solid #ccc; font-size: 11px; }
            td { padding: 7px 10px; border-bottom: 1px solid #e0e0e0; }
            tr:last-child td { border-bottom: none; }
            .total-row td { font-weight: bold; background: #f8f8f8; }
          </style>
        </head>
        <body>
          <h1>Sales Report</h1>
          <p>Period: ${dateRange.start.split("T")[0]} → ${dateRange.end.split("T")[0]} &nbsp;|&nbsp; ${rows.length} transactions</p>
          <table>
            <thead>
              <tr>
                <th>Invoice #</th><th>Date & Time</th><th>Customer</th><th>Cashier</th>
                <th>Payment</th><th>Status</th><th style="text-align:right">Net Amount</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="5">Total</td>
                <td style="text-align:right">${formatCurrency(
                  rows.reduce((sum: number, s: SalesReportRecord) => sum + s.netAmount, 0)
                )}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground mt-2">
            Analyze your business performance and inventory health.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={exportData}
          >
            <Download size={18} />
            Export CSV
          </Button>
          <Button
            className="gap-2 bg-primary hover:bg-primary/90"
            onClick={printPDF}
            disabled={activeTab !== "sales"}
          >
            <FileText size={18} />
            Print Sales PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sales" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-900/50 p-1 border border-gray-800">
          <TabsTrigger value="sales" className="gap-2">
            <TrendingUp size={16} /> Sales History
          </TabsTrigger>
          <FeatureGuard feature="RETURNS">
            <TabsTrigger value="returns" className="gap-2">
              <RotateCcw size={16} /> Returns History
            </TabsTrigger>
          </FeatureGuard>
          <FeatureGuard feature="INVENTORY">
            <TabsTrigger value="inventory" className="gap-2">
              <PieChart size={16} /> Inventory Valuation
            </TabsTrigger>
          </FeatureGuard>
          <FeatureGuard feature="EMPLOYEES">
            <TabsTrigger value="employees" className="gap-2">
              <Users size={16} /> Employee Performance
            </TabsTrigger>
          </FeatureGuard>
          <FeatureGuard feature="CUSTOMERS">
            <TabsTrigger value="customers" className="gap-2">
              <Star size={16} /> Top Customers
            </TabsTrigger>
          </FeatureGuard>
          <FeatureGuard feature="TAX_CONFIG">
            <TabsTrigger value="tax" className="gap-2">
              <Receipt size={16} /> Tax Summary
            </TabsTrigger>
          </FeatureGuard>
          <FeatureGuard feature="ADVANCED_ANALYTICS">
            <TabsTrigger value="profitability" className="gap-2">
              <BarChart3 size={16} /> Profitability
            </TabsTrigger>
          </FeatureGuard>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          {/* 📈 Sales Trend Chart (New Visualization) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 bg-gray-900/50 border-gray-800 backdrop-blur-sm h-[320px]">
              <CardHeader className="pb-0">
                <CardTitle className="text-sm font-medium">Sales Volume Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-full pb-10">
                <div className="w-full h-full">
                  {salesChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#facc15" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#9ca3af" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#9ca3af" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                          labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                          itemStyle={{ color: '#facc15' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#facc15" 
                          fillOpacity={1} 
                          fill="url(#colorSales)" 
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs italic">
                      <p>Financial transaction volume across selected period</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <div className="space-y-4">
              <Card className="bg-gray-900/50 border-gray-800 p-4">
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <h3 className="text-2xl font-bold text-primary">{formatCurrency(salesData?.content?.reduce((sum: number, s: SalesReportRecord) => sum + s.netAmount, 0) || 0)}</h3>
              </Card>
              <Card className="bg-gray-900/50 border-gray-800 p-4">
                <p className="text-xs text-muted-foreground">Total Transactions</p>
                <h3 className="text-2xl font-bold">{salesData?.totalElements || 0}</h3>
              </Card>
              <Card className="bg-gray-900/50 border-gray-800 p-4">
                <p className="text-xs text-muted-foreground">Average Order Value</p>
                <h3 className="text-2xl font-bold text-emerald-400">
                  {formatCurrency((salesData?.content?.reduce((sum: number, s: SalesReportRecord) => sum + s.netAmount, 0) || 0) / (salesData?.totalElements || 1))}
                </h3>
              </Card>
            </div>
          </div>

          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle>Sales Filters</CardTitle>
                <CardDescription>Select a date range to filter sales records.</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-800 rounded-md p-1 px-3 border border-gray-700">
                  <Calendar size={16} className="text-gray-400" />
                  <input
                    type="date"
                    className="bg-transparent border-none text-sm focus:ring-0"
                    value={dateRange.start.split('T')[0]}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: `${e.target.value}T00:00:00` }))}
                  />
                  <ArrowRight size={14} className="text-gray-600" />
                  <input
                    type="date"
                    className="bg-transparent border-none text-sm focus:ring-0"
                    value={dateRange.end.split('T')[0]}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: `${e.target.value}T23:59:59` }))}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-gray-800 bg-gray-900/40">
                <Table>
                  <TableHeader className="bg-gray-800/50">
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Cashier</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Net Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-muted-foreground animate-pulse">
                          Loading sales report...
                        </TableCell>
                      </TableRow>
                    ) : !salesData?.content?.length ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                          No sales found for the selected period.
                        </TableCell>
                      </TableRow>
                    ) : (
                      salesData.content.map((sale) => (
                        <Fragment key={sale.saleId}>
                          <TableRow key={sale.saleId} className="hover:bg-gray-800/50 cursor-pointer" onClick={() => toggleSaleExpanded(sale.saleId)}>
                            <TableCell className="w-10 px-3">
                              {expandedSales[sale.saleId] ? <ChevronDown size={16} className="text-primary" /> : <ChevronRight size={16} className="text-gray-500" />}
                            </TableCell>
                            <TableCell className="font-mono text-primary">{sale.invoiceNumber}</TableCell>
                            <TableCell className="text-gray-300">
                              {format(new Date(sale.createdAt), "MMM dd, yyyy HH:mm")}
                            </TableCell>
                            <TableCell>{sale.customerName}</TableCell>
                            <TableCell className="text-gray-400 text-xs">{sale.cashierName}</TableCell>
                            <TableCell>
                              <span className="text-xs text-gray-400 uppercase">{sale.paymentMethod}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={sale.paymentStatus === 'PAID' ? 'default' : 'outline'} className={sale.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : sale.paymentStatus === 'REFUNDED' ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : ''}>
                                {sale.paymentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold text-gray-100">
                              {formatCurrency(sale.netAmount)}
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setReturnSaleId(sale.saleId)}
                                className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                              >
                                <RotateCcw size={14} className="mr-1" /> Return
                              </Button>
                            </TableCell>
                          </TableRow>
                          {expandedSales[sale.saleId] && (
                            <TableRow key={`${sale.saleId}-items`}>
                              <TableCell colSpan={9} className="p-0 border-b border-gray-800">
                                <div className="bg-gray-950/80 px-6 py-4 ml-8 mr-4 my-2 rounded-lg border border-gray-800/50">
                                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Items in this Transaction</h4>
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="text-gray-500 text-xs uppercase">
                                        <th className="text-left pb-2 pr-4">Product</th>
                                        <th className="text-left pb-2 pr-4">SKU</th>
                                        <th className="text-center pb-2 pr-4">Qty</th>
                                        <th className="text-right pb-2 pr-4">Unit Price</th>
                                        <th className="text-right pb-2 pr-4">Tax</th>
                                        <th className="text-right pb-2 pr-4">Discount</th>
                                        <th className="text-right pb-2">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {sale.items?.map((item, idx) => (
                                        <tr key={idx} className="border-t border-gray-800/30">
                                          <td className="py-2 pr-4">
                                            <span className="text-gray-200 font-medium">{item.productName}</span>
                                            {item.description && (
                                              <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">↳ {item.description}</p>
                                            )}
                                          </td>
                                          <td className="py-2 pr-4 text-gray-400 font-mono text-xs">{item.sku || '—'}</td>
                                          <td className="py-2 pr-4 text-center text-gray-300">{item.quantity}</td>
                                          <td className="py-2 pr-4 text-right text-gray-300">{formatCurrency(item.unitPrice)}</td>
                                          <td className="py-2 pr-4 text-right text-gray-400">{formatCurrency(item.taxAmount)}</td>
                                          <td className="py-2 pr-4 text-right text-gray-400">{formatCurrency(item.discountAmount)}</td>
                                          <td className="py-2 text-right font-semibold text-gray-100">{formatCurrency(item.totalAmount)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <Pagination 
                currentPage={salesPage} 
                totalPages={salesData?.totalPages || 0} 
                onPageChange={setSalesPage}
                isLoading={salesLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <FeatureGuard feature="RETURNS">
        <TabsContent value="returns" className="space-y-6">
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle>Returns History</CardTitle>
                <CardDescription>View past returns and manage pending approvals.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-gray-800 bg-gray-900/40">
                <Table>
                  <TableHeader className="bg-gray-800/50">
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Return #</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Processed By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Refund Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnsLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground animate-pulse">
                          Loading returns history...
                        </TableCell>
                      </TableRow>
                    ) : returnsData?.content?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                          No returns found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      returnsData?.content?.map((ret: ReturnResponse) => (
                        <>
                          <TableRow key={ret.id} className="hover:bg-gray-800/50 cursor-pointer" onClick={() => toggleReturnExpanded(ret.id)}>
                            <TableCell className="w-10 px-3">
                              {expandedReturns[ret.id] ? <ChevronDown size={16} className="text-primary" /> : <ChevronRight size={16} className="text-gray-500" />}
                            </TableCell>
                            <TableCell className="font-mono text-primary">{ret.returnNumber}</TableCell>
                            <TableCell className="text-gray-300">
                              {format(new Date(ret.createdAt), "MMM dd, yyyy HH:mm")}
                            </TableCell>
                            <TableCell>{ret.reason}</TableCell>
                            <TableCell className="text-gray-400 text-xs">{ret.processedByName || 'Unknown'}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  ret.status === 'COMPLETED' ? 'default' : 
                                  ret.status === 'PENDING' ? 'secondary' : 
                                  ret.status === 'APPROVED' ? 'default' : 'destructive'
                                }
                                className={
                                  ret.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 
                                  ret.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : ''
                                }
                              >
                                {ret.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold text-gray-100">
                              {formatCurrency(ret.refundAmount)}
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              {ret.status === 'PENDING' && (user?.roles?.includes('MANAGER') || user?.roles?.includes('ADMIN')) ? (
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => approveReturnMutation.mutate({ id: ret.id, approve: true })}
                                    disabled={approveReturnMutation.isPending}
                                    className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 px-2"
                                    title="Approve Return"
                                  >
                                    <ShieldCheck size={16} />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => approveReturnMutation.mutate({ id: ret.id, approve: false })}
                                    disabled={approveReturnMutation.isPending}
                                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10 px-2"
                                    title="Reject Return"
                                  >
                                    <ShieldAlert size={16} />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground mr-2">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                          {expandedReturns[ret.id] && (
                            <TableRow key={`${ret.id}-items`}>
                              <TableCell colSpan={8} className="p-0 border-b border-gray-800">
                                <div className="bg-gray-950/80 px-6 py-4 ml-8 mr-4 my-2 rounded-lg border border-gray-800/50">
                                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Returned Items</h4>
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="text-gray-500 text-xs uppercase">
                                        <th className="text-left pb-2 pr-4">Product</th>
                                        <th className="text-center pb-2 pr-4">Qty Returned</th>
                                        <th className="text-right pb-2 pr-4">Unit Price</th>
                                        <th className="text-right pb-2">Refund Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {ret.items?.map((item, idx) => (
                                        <tr key={idx} className="border-t border-gray-800/30">
                                          <td className="py-2 pr-4 text-gray-200 font-medium">{item.productName || 'Unknown Product'}</td>
                                          <td className="py-2 pr-4 text-center text-gray-300">{item.quantityReturned}</td>
                                          <td className="py-2 pr-4 text-right text-gray-300">{formatCurrency(item.unitPrice)}</td>
                                          <td className="py-2 text-right font-semibold text-gray-100">{formatCurrency(item.refundAmount)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <Pagination 
                currentPage={returnsPage} 
                totalPages={returnsData?.totalPages || 0} 
                onPageChange={setReturnsPage}
                isLoading={returnsLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
        </FeatureGuard>

        <FeatureGuard feature="INVENTORY">
        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2">
                <CardDescription>Total Inventory Cost</CardDescription>
                <CardTitle className="text-3xl font-bold flex items-center gap-2">
                  <DollarSign className="text-primary" />
                  {valuationLoading ? "..." : formatCurrency(valuationData?.totalCostValue || 0)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">The net value based on product cost price.</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2">
                <CardDescription>Retail Stock Value</CardDescription>
                <CardTitle className="text-3xl font-bold flex items-center gap-2 text-emerald-400">
                  <TrendingUp />
                  {valuationLoading ? "..." : formatCurrency(valuationData?.totalRetailValue || 0)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Potential revenue if everything is sold.</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2">
                <CardDescription>Potential Profit</CardDescription>
                <CardTitle className="text-3xl font-bold text-amber-400">
                  {valuationLoading ? "..." : formatCurrency(valuationData?.potentialProfit || 0)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-400/10 text-amber-400">
                    {valuationLoading ? "0%" : (((valuationData?.potentialProfit || 0) / (valuationData?.totalCostValue || 1)) * 100).toFixed(1) + "% Margin"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>Detailed valuation across different product categories.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-gray-800 bg-gray-900/40">
                <Table>
                  <TableHeader className="bg-gray-800/50">
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Products</TableHead>
                      <TableHead className="text-center">Total Stock</TableHead>
                      <TableHead className="text-right">Cost Value</TableHead>
                      <TableHead className="text-right">Retail Value</TableHead>
                      <TableHead className="text-right">Potential Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {valuationLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground animate-pulse">
                          Loading valuation report...
                        </TableCell>
                      </TableRow>
                    ) : (
                      valuationData?.categoryBreakdown.map((cat) => (
                        <TableRow key={cat.categoryName} className="hover:bg-gray-800/50">
                          <TableCell className="font-medium">{cat.categoryName}</TableCell>
                          <TableCell className="text-center">{cat.productCount}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="border-gray-700">
                              {cat.stockCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(cat.costValue)}</TableCell>
                          <TableCell className="text-right text-emerald-400">{formatCurrency(cat.retailValue)}</TableCell>
                          <TableCell className="text-right font-bold text-amber-400">
                            {formatCurrency(cat.retailValue - cat.costValue)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </FeatureGuard>

        {/* ── Employee Performance ─────────────────────────────────────── */}
        <FeatureGuard feature="EMPLOYEES">
        <TabsContent value="employees" className="space-y-6">
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Employee Performance</CardTitle>
              <CardDescription>Cashier revenue, transaction count, and averages for the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-gray-800 bg-gray-900/40">
                <Table>
                  <TableHeader className="bg-gray-800/50">
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-center">Transactions</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                      <TableHead className="text-right">Avg Basket</TableHead>
                      <TableHead className="text-right">Total Discount Given</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-10 animate-pulse text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : !employeeData?.content?.length ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No data for this period.</TableCell></TableRow>
                    ) : (
                      employeeData.content.map((emp, i) => (
                        <TableRow key={emp.userId} className="hover:bg-gray-800/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                              <div>
                                <div className="font-medium text-white">{emp.employeeName}</div>
                                <div className="text-xs text-gray-500">{emp.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="border-gray-600">{emp.transactionCount}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-emerald-400">{formatCurrency(emp.totalRevenue)}</TableCell>
                          <TableCell className="text-right text-gray-300">{formatCurrency(emp.avgTransactionValue)}</TableCell>
                          <TableCell className="text-right text-amber-400">{formatCurrency(emp.totalDiscount)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <Pagination 
                currentPage={employeePage} 
                totalPages={employeeData?.totalPages || 0} 
                onPageChange={setEmployeePage}
                isLoading={employeeLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
        </FeatureGuard>

        {/* ── Top Customers ────────────────────────────────────────────── */}
        <FeatureGuard feature="CUSTOMERS">
        <TabsContent value="customers" className="space-y-6">
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Top Customers by Spend</CardTitle>
              <CardDescription>Highest-value customers across all time.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-gray-800 bg-gray-900/40">
                <Table>
                  <TableHeader className="bg-gray-800/50">
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-center">Visits</TableHead>
                      <TableHead className="text-right">Total Spent</TableHead>
                      <TableHead className="text-right">Loyalty Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCustomersLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-10 animate-pulse text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : !topCustomersData?.content?.length ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No customer data found.</TableCell></TableRow>
                    ) : (
                      topCustomersData.content.map((cust, i) => (
                        <TableRow key={cust.customerId} className="hover:bg-gray-800/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                              <div>
                                <div className="font-medium text-white">{cust.customerName}</div>
                                <div className="text-xs text-gray-500">{cust.email || cust.phone || '—'}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="border-gray-600">{cust.transactionCount}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-emerald-400">{formatCurrency(cust.totalSpent)}</TableCell>
                          <TableCell className="text-right">
                            <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                              <Star size={12} fill="currentColor" />{cust.loyaltyPoints.toLocaleString()}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <Pagination 
                currentPage={customersPage} 
                totalPages={topCustomersData?.totalPages || 0} 
                onPageChange={setCustomersPage}
                isLoading={topCustomersLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
        </FeatureGuard>

        {/* ── Tax Summary ──────────────────────────────────────────────── */}
        <FeatureGuard feature="TAX_CONFIG">
        <TabsContent value="tax" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2">
                <CardDescription>Total Tax Collected</CardDescription>
                <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2">
                  <Percent size={28} />
                  {taxLoading ? '...' : formatCurrency(taxData?.totalTaxCollected || 0)}
                </CardTitle>
              </CardHeader>
              <CardContent><p className="text-xs text-muted-foreground">Across all payment methods for the selected period.</p></CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2">
                <CardDescription>Tax-Generating Transactions</CardDescription>
                <CardTitle className="text-3xl font-bold">{taxLoading ? '...' : taxData?.totalTransactions ?? 0}</CardTitle>
              </CardHeader>
              <CardContent><p className="text-xs text-muted-foreground">Total number of sales in this period.</p></CardContent>
            </Card>
          </div>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle>Breakdown by Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-gray-800 bg-gray-900/40">
                <Table>
                  <TableHeader className="bg-gray-800/50">
                    <TableRow>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className="text-center">Transactions</TableHead>
                      <TableHead className="text-right">Gross Revenue</TableHead>
                      <TableHead className="text-right">Tax Collected</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-10 animate-pulse text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : !taxData?.breakdown?.length ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No tax data for this period.</TableCell></TableRow>
                    ) : (
                      taxData.breakdown.map((row: TaxLineItem) => (
                        <TableRow key={row.paymentMethod} className="hover:bg-gray-800/50">
                          <TableCell className="font-medium">{row.paymentMethod}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="border-gray-600">{row.transactionCount}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-gray-300">{formatCurrency(row.grossRevenue)}</TableCell>
                          <TableCell className="text-right font-bold text-primary">{formatCurrency(row.taxCollected)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </FeatureGuard>

        {/* ── Profitability ────────────────────────────────────────────── */}
        <FeatureGuard feature="ADVANCED_ANALYTICS">
        <TabsContent value="profitability" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 bg-gray-900/50 border-gray-800 backdrop-blur-sm h-[320px]">
              <CardHeader className="pb-0">
                <CardTitle className="text-sm font-medium">Top 10 Profitable Products</CardTitle>
              </CardHeader>
              <CardContent className="h-full pb-10">
                <div className="w-full h-full">
                  {profitChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={profitChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#9ca3af" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#9ca3af" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                          itemStyle={{ color: '#10b981' }}
                        />
                        <Bar dataKey="profit" name="Gross Profit" radius={[4, 4, 0, 0]}>
                          {profitChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#10b981" : "#059669"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs italic">
                      <p>Visual breakdown of product revenue vs profit</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
              {[{ label: 'Total Revenue', value: formatCurrency(profitData?.totalRevenue || 0), cls: 'text-white' },
                { label: 'Total Profit', value: formatCurrency(profitData?.totalProfit || 0), cls: 'text-emerald-400' },
                { label: 'Total COGS', value: formatCurrency(profitData?.totalCost || 0), cls: 'text-red-400' },
                { label: 'Overall Margin', value: `${profitData?.overallMarginPct ?? 0}%`, cls: 'text-amber-400' },
              ].map(stat => (
                <Card key={stat.label} className="bg-gray-900/50 border-gray-800 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.cls}`}>{profitLoading ? '...' : stat.value}</p>
                </Card>
              ))}
            </div>
          </div>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle>Product Profitability Breakdown</CardTitle>
              <CardDescription>Revenue, cost, and margin per product sold in the period.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-gray-800 bg-gray-900/40">
                <Table>
                  <TableHeader className="bg-gray-800/50">
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Units Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">COGS</TableHead>
                      <TableHead className="text-right">Gross Profit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profitLoading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-10 animate-pulse text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : !profitData?.products?.content?.length ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No sales data for this period.</TableCell></TableRow>
                    ) : (
                      profitData.products.content.map((p: ProductProfitRecord) => (
                        <TableRow key={p.productId} className="hover:bg-gray-800/50">
                          <TableCell>
                            <div className="font-medium text-white">{p.productName}</div>
                            <div className="text-xs text-gray-500 font-mono">{p.sku}</div>
                          </TableCell>
                          <TableCell className="text-gray-400 text-sm">{p.category}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="border-gray-600">{p.unitsSold}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-gray-200">{formatCurrency(p.revenue)}</TableCell>
                          <TableCell className="text-right text-red-400">{formatCurrency(p.costOfGoodsSold)}</TableCell>
                          <TableCell className="text-right font-bold text-emerald-400">{formatCurrency(p.grossProfit)}</TableCell>
                          <TableCell className="text-right">
                            <span className={`font-bold ${p.marginPct >= 30 ? 'text-emerald-400' : p.marginPct >= 15 ? 'text-amber-400' : 'text-red-400'}`}>
                              {p.marginPct}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <Pagination 
                currentPage={profitPage} 
                totalPages={profitData?.products?.totalPages || 0} 
                onPageChange={setProfitPage}
                isLoading={profitLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
        </FeatureGuard>
      </Tabs>

      {/* Modals */}
      {returnSaleId && (
        <ReturnModal 
          saleId={returnSaleId} 
          onClose={() => setReturnSaleId(null)} 
          onExchange={(saleId, items, credit) => setExchangeData({ saleId, returnItems: items, returnCredit: credit })}
        />
      )}

      {exchangeData && (
        <ExchangeModal
          saleId={exchangeData.saleId}
          returnItems={exchangeData.returnItems}
          returnCredit={exchangeData.returnCredit}
          onClose={() => setExchangeData(null)}
        />
      )}
    </div>
  );
}
