"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseOrderService, PurchaseOrder, POStatus } from "@/services/purchaseOrderService";
import { supplierService } from "@/services/supplierService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, ArrowRight, Loader2, FileText, CheckCircle2, Clock, ChevronRight, ChevronDown, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { CreatePOModal } from "./CreatePOModal";
import { ReceivePOModal } from "./ReceivePOModal";
import { CURRENCY } from '@/lib/utils';
import { FeatureGuard } from "@/components/auth/FeatureGuard";

const STATUS_OPTIONS: { value: POStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ORDERED', label: 'Ordered' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: "Draft", color: "bg-gray-500/10 text-gray-400 border-gray-500/20", icon: FileText },
  ORDERED: { label: "Ordered", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Clock },
  PARTIAL: { label: "Partial", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: CheckCircle2 },
  RECEIVED: { label: "Received", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: FileText },
};

export default function PurchaseOrdersPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filters — initialised from URL so a reload / back-nav restores the view.
  // The reverse direction (state → URL) is handled by the effect below.
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 0);
  const [statusFilter, setStatusFilter] = useState<POStatus | 'ALL'>(
    (searchParams.get('status') as POStatus | 'ALL') || 'ALL'
  );
  const [supplierFilter, setSupplierFilter] = useState<string>(
    searchParams.get('supplierId') || 'ALL'
  );
  const [search, setSearch] = useState<string>(searchParams.get('search') || '');

  // Mirror filter state into the URL so the page is bookmarkable / shareable
  // and a reopen restores exactly what the user was looking at. We use replace
  // (not push) to avoid spamming history on every keystroke.
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (supplierFilter !== 'ALL') params.set('supplierId', supplierFilter);
    if (search.trim()) params.set('search', search.trim());
    if (page > 0) params.set('page', String(page));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [statusFilter, supplierFilter, search, page, router, pathname]);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [receiveModalPO, setReceiveModalPO] = useState<PurchaseOrder | null>(null);

  // Expanded State
  const [expandedPOs, setExpandedPOs] = useState<Record<string, boolean>>({});

  const togglePOExpanded = (id: string) => {
    setExpandedPOs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers-for-po-filter"],
    queryFn: () => supplierService.getSuppliers(0, 200),
  });
  const supplierOptions = suppliersData?.content ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ["purchase-orders", page, statusFilter, supplierFilter, search],
    queryFn: () => purchaseOrderService.getPurchaseOrders(page, 10, {
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      supplierId: supplierFilter === 'ALL' ? undefined : supplierFilter,
      search: search || undefined,
    }),
  });

  const hasActiveFilters = statusFilter !== 'ALL' || supplierFilter !== 'ALL' || search.trim() !== '';
  const resetFilters = () => {
    setStatusFilter('ALL');
    setSupplierFilter('ALL');
    setSearch('');
    setPage(0);
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: POStatus }) => 
        purchaseOrderService.updatePurchaseOrderStatus(id, status),
    onSuccess: () => {
        toast.success("Purchase order status updated");
        queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
    onError: (error: unknown) => {
        toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update status");
    }
  });

  const handleUpdateStatus = (po: PurchaseOrder, newStatus: POStatus) => {
    if (confirm(`Are you sure you want to change the status to ${newStatus}?`)) {
      statusMutation.mutate({ id: po.id, status: newStatus });
    }
  };

  return (
    <FeatureGuard
      feature="PURCHASE_ORDERS"
      fallback={
        <div className="flex h-full min-h-[500px] flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
          <div className="rounded-full bg-red-500/10 p-4 mb-4">
            <FileText className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Feature Not Available</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your current subscription plan does not include access to the Purchase Orders module. 
            Please upgrade your workspace to manage purchase orders directly from the POS.
          </p>
        </div>
      }
    >
    <div className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Purchase Orders</h1>
          <p className="text-gray-400">Manage internal stock requests and vendor orders</p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create PO
        </Button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search PO number..."
              value={search}
              onChange={(e) => { setPage(0); setSearch(e.target.value); }}
              className="pl-9 bg-gray-950 border-gray-800"
            />
          </div>

          <div className="w-[170px]">
            <Select
              value={statusFilter}
              onValueChange={(v) => { setPage(0); setStatusFilter(v as POStatus | 'ALL'); }}
            >
              <SelectTrigger className="bg-gray-950 border-gray-800">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800 text-white">
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[220px]">
            <Select
              value={supplierFilter}
              onValueChange={(v) => { setPage(0); setSupplierFilter(v); }}
            >
              <SelectTrigger className="bg-gray-950 border-gray-800">
                <SelectValue placeholder="Supplier" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800 text-white">
                <SelectItem value="ALL">All suppliers</SelectItem>
                {supplierOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-gray-400 hover:text-white gap-1"
            >
              <X className="h-4 w-4" /> Clear
            </Button>
          )}

          <span className="ml-auto text-xs text-gray-500">
            {data ? `${data.totalElements} result${data.totalElements === 1 ? '' : 's'}` : ''}
          </span>
        </div>

        <div className="rounded-md border border-gray-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-950/50">
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="w-10 pl-6"></TableHead>
                <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">PO Number</TableHead>
                <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Date</TableHead>
                <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Supplier</TableHead>
                <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Destination</TableHead>
                <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Total Amount</TableHead>
                <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="text-right text-gray-400 font-bold uppercase text-[10px] tracking-widest pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-500" />
                  </TableCell>
                </TableRow>
              ) : data?.content.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                    No purchase orders found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.content.map((po) => {
                  const statusInfo = statusConfig[po.status] || statusConfig['DRAFT'];
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <React.Fragment key={po.id}>
                      <TableRow 
                        className="border-gray-800 group hover:bg-white/5 cursor-pointer transition-colors"
                        onClick={() => togglePOExpanded(po.id)}
                      >
                        <TableCell className="w-10 pl-6 py-4">
                          {expandedPOs[po.id] ? <ChevronDown size={16} className="text-primary" /> : <ChevronRight size={16} className="text-gray-500" />}
                        </TableCell>
                        <TableCell className="font-medium text-white py-4">
                          {po.poNumber}
                        </TableCell>
                        <TableCell className="text-gray-400 py-4">
                      {format(new Date(po.createdAt), "MMM d, yyyy")}
                    </TableCell>
                        <TableCell className="text-gray-300 py-4">
                          {po.supplierName}
                        </TableCell>
                        <TableCell className="text-gray-300 py-4">
                          {po.branchName}
                        </TableCell>
                        <TableCell className="text-emerald-400 font-medium py-4">
                          {CURRENCY.symbol} {po.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-4">
                      <Badge variant="outline" className={`${statusInfo.color} font-medium border rounded-md px-2 py-0.5 whitespace-nowrap`}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                        <TableCell className="py-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end items-center gap-2">
                            {po.status === 'DRAFT' && (
                              <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(po, 'ORDERED')}
                                  className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/30 transition-colors"
                              >
                                  Mark Ordered <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            )}

                            {(po.status === 'ORDERED' || po.status === 'PARTIAL') && (
                              <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => setReceiveModalPO(po)}
                                  className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-600/30 transition-colors"
                              >
                                  Receive Items
                              </Button>
                            )}

                            {(po.status === 'DRAFT' || po.status === 'ORDERED') && (
                                <div className="w-[110px]">
                                  <Select 
                                      onValueChange={(val) => handleUpdateStatus(po, val as POStatus)}
                                  >
                                      <SelectTrigger className="h-8 text-xs bg-gray-950 border-gray-800">
                                          <SelectValue placeholder="Update..." />
                                      </SelectTrigger>
                                      <SelectContent className="bg-gray-900 border-gray-800">
                                          {po.status === 'DRAFT' && <SelectItem value="CANCELLED">Cancel</SelectItem>}
                                          {po.status === 'ORDERED' && <SelectItem value="CANCELLED">Cancel</SelectItem>}
                                      </SelectContent>
                                  </Select>
                                </div>
                            )}
                            
                            {/* Always show a view detail icon if no other actions are available so the column isn't empty */}
                            {!['DRAFT', 'ORDERED', 'PARTIAL'].includes(po.status) && (
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => togglePOExpanded(po.id)}>
                                View Details
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedPOs[po.id] && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={8} className="p-0 border-b border-gray-800 bg-gray-950/30">
                            <div className="bg-gray-950/80 px-6 py-4 ml-8 mr-4 my-2 rounded-lg border border-gray-800/50">
                              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Items in this PO</h4>
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-gray-500 text-xs uppercase">
                                    <th className="text-left pb-2 pr-4">Product</th>
                                    <th className="text-left pb-2 pr-4">SKU</th>
                                    <th className="text-center pb-2 pr-4">Ordered</th>
                                    <th className="text-center pb-2 pr-4">Received</th>
                                    <th className="text-right pb-2 pr-4">Unit Cost</th>
                                    <th className="text-right pb-2">Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {po.items?.map((item, idx) => (
                                    <tr key={idx} className="border-t border-gray-800/30">
                                      <td className="py-2 pr-4 text-gray-200 font-medium">{item.productName}</td>
                                      <td className="py-2 pr-4 text-gray-400 font-mono text-xs">{item.sku || 'N/A'}</td>
                                      <td className="py-2 pr-4 text-center text-gray-300 font-medium">{item.orderedQuantity}</td>
                                      <td className="py-2 pr-4 text-center text-emerald-400 font-semibold">{item.receivedQuantity}</td>
                                      <td className="py-2 pr-4 text-right text-gray-300">{CURRENCY.symbol} {item.unitCost.toFixed(2)}</td>
                                      <td className="py-2 text-right font-semibold text-gray-100">{CURRENCY.symbol} {item.totalCost.toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-400">
              Showing <span className="font-medium text-gray-200">{page * 10 + 1}</span> to{" "}
              <span className="font-medium text-gray-200">
                {Math.min((page + 1) * 10, data.totalElements)}
              </span>{" "}
              of <span className="font-medium text-gray-200">{data.totalElements}</span> orders
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="border-gray-800 text-gray-300 hover:bg-gray-800"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages - 1}
                className="border-gray-800 text-gray-300 hover:bg-gray-800"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <CreatePOModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <ReceivePOModal isOpen={!!receiveModalPO} onClose={() => setReceiveModalPO(null)} purchaseOrder={receiveModalPO} />

    </div>
    </FeatureGuard>
  );
}
