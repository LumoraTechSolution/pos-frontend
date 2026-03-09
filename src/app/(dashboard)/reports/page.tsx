"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { reportService } from "@/services/reportService";
import { returnService, ReturnResponse } from "@/services/returnService";
import { SalesReportRecord, SalesReportItemRecord, InventoryValuationReport } from "@/types/report";
import { PageResponse } from "@/types/common";
import { format } from "date-fns";
import {
  FileText,
  TrendingUp,
  Calendar,
  Download,
  ArrowRight,
  PieChart,
  DollarSign,
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

export default function ReportsPage() {
  const { user } = useAuthStore();
  // Action states
  const [returnSaleId, setReturnSaleId] = useState<string | null>(null);
  const [exchangeData, setExchangeData] = useState<{ saleId: string; returnItems: SalesReportItemRecord[]; returnCredit: number } | null>(null);

  // Expanded rows state
  const [expandedSales, setExpandedSales] = useState<Record<string, boolean>>({});
  const [expandedReturns, setExpandedReturns] = useState<Record<string, boolean>>({});

  const toggleSaleExpanded = (id: string) => setExpandedSales(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleReturnExpanded = (id: string) => setExpandedReturns(prev => ({ ...prev, [id]: !prev[id] }));

  const [dateRange, setDateRange] = useState({
    start: format(new Date(new Date().setDate(new Date().getDate() - 7)), "yyyy-MM-dd'T'00:00:00"),
    end: format(new Date(), "yyyy-MM-dd'T'23:59:59"),
  });

  const { data: salesData, isLoading: salesLoading } = useQuery<PageResponse<SalesReportRecord>>({
    queryKey: ["reports", "sales", dateRange],
    queryFn: () => reportService.getSalesReport(dateRange.start, dateRange.end),
  });

  const { data: returnsData, isLoading: returnsLoading, refetch: refetchReturns } = useQuery<PageResponse<ReturnResponse>>({
    queryKey: ["reports", "returns"],
    queryFn: () => returnService.getAllReturns(),
  });

  const { data: valuationData, isLoading: valuationLoading } = useQuery<InventoryValuationReport>({
    queryKey: ["reports", "valuation"],
    queryFn: reportService.getInventoryValuation,
  });

  const approveReturnMutation = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => returnService.approveReturn(id, approve),
    onSuccess: () => {
      refetchReturns();
    }
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

  // ─── CSV Export (pure browser, no library) ────────────────────────────────
  const exportCSV = () => {
    const rows = salesData?.content ?? [];
    if (rows.length === 0) return;

    const headers = [
      "Invoice #",
      "Date & Time",
      "Customer",
      "Cashier",
      "Payment Method",
      "Status",
      "Total",
      "Tax",
      "Discount",
      "Net Amount",
    ];

    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

    const csvRows = [
      headers.join(","),
      ...rows.map((s) =>
        [
          escape(s.invoiceNumber),
          escape(format(new Date(s.createdAt), "yyyy-MM-dd HH:mm")),
          escape(s.customerName),
          escape(s.cashierName),
          escape(s.paymentMethod),
          escape(s.paymentStatus),
          escape(s.totalAmount),
          escape(s.taxAmount),
          escape(s.discountAmount),
          escape(s.netAmount),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-report-${dateRange.start.split("T")[0]}_${dateRange.end.split("T")[0]}.csv`;
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
                  rows.reduce((sum, s) => sum + s.netAmount, 0)
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
            onClick={exportCSV}
            disabled={!salesData?.content?.length}
          >
            <Download size={18} />
            Export CSV
          </Button>
          <Button
            className="gap-2 bg-primary hover:bg-primary/90"
            onClick={printPDF}
            disabled={!salesData?.content?.length}
          >
            <FileText size={18} />
            Generate PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="bg-gray-900/50 p-1 border border-gray-800">
          <TabsTrigger value="sales" className="gap-2">
            <TrendingUp size={16} /> Sales History
          </TabsTrigger>
          <TabsTrigger value="returns" className="gap-2">
            <RotateCcw size={16} /> Returns History
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <PieChart size={16} /> Inventory Valuation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
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
                    ) : salesData?.content.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                          No sales found for the selected period.
                        </TableCell>
                      </TableRow>
                    ) : (
                      salesData?.content.map((sale) => (
                        <>
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
                        </>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
            </CardContent>
          </Card>
        </TabsContent>

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
      </Tabs>

      {/* Modals */}
      {returnSaleId && (
        <ReturnModal 
          saleId={returnSaleId} 
          onClose={() => setReturnSaleId(null)} 
          onExchange={(saleId, items, credit) => setExchangeData({ saleId, returnItems: items as any, returnCredit: credit })}
        />
      )}

      {exchangeData && (
        <ExchangeModal
          saleId={exchangeData.saleId}
          returnItems={exchangeData.returnItems as any}
          returnCredit={exchangeData.returnCredit}
          onClose={() => setExchangeData(null)}
        />
      )}
    </div>
  );
}
