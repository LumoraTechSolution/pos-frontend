"use client";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, Search, Plus, ArrowRightLeft, Flag, X } from 'lucide-react';
import { format } from 'date-fns';
import { stockTransferService } from '@/services/stockTransferService';
import { StockTransferModal } from '@/components/inventory/StockTransferModal';
import { toast } from 'sonner';

export default function StockTransfersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['stockTransfers', page, statusFilter],
    queryFn: () => stockTransferService.getTransfers(page, 10, statusFilter)
  });

  const completeMutation = useMutation({
    mutationFn: stockTransferService.completeTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockTransfers'] });
      toast.success("Transfer completed and stock updated");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to complete transfer")
  });

  const inTransitMutation = useMutation({
    mutationFn: stockTransferService.markInTransit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockTransfers'] });
      toast.success("Transfer marked as In Transit");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to mark as in-transit")
  });

  const cancelMutation = useMutation({
    mutationFn: stockTransferService.cancelTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockTransfers'] });
      toast.success("Transfer cancelled");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to cancel transfer")
  });

  const transfers = data?.content || [];
  const totalPages = data?.totalPages || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">Pending</span>;
      case 'IN_TRANSIT':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-500 border border-blue-500/30">In Transit</span>;
      case 'COMPLETED':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500 border border-green-500/30">Completed</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-500 border border-red-500/30">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <ArrowRightLeft className="text-primary" size={28} />
            Stock Transfers
          </h1>
          <p className="text-gray-400 mt-1 flex items-center gap-2">
            Move inventory smoothly between your branches
          </p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
        >
          <Plus size={18} />
          New Transfer
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-gray-800 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="bg-gray-950 border border-gray-800 text-sm rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-950/50 text-gray-400 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Transfer ID / Date</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4 text-center">Qty</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading transfers...</td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Truck size={48} className="mb-4 opacity-20" />
                      <p className="text-lg">No transfers found</p>
                      <p className="text-sm mt-1">Change filters or create a new transfer</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-200" title={transfer.id}>TRF-{transfer.id.substring(0, 6).toUpperCase()}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {format(new Date(transfer.createdAt), "MMM d, yyyy h:mm a")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{transfer.productName}</div>
                      <div className="text-xs text-gray-500">SKU: {transfer.productSku}</div>
                      {transfer.notes && (
                        <div className="text-xs text-gray-400 italic mt-1 line-clamp-1 truncate max-w-[150px]" title={transfer.notes}>
                          {transfer.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-300 bg-gray-800/50 px-2 py-1 rounded truncate max-w-[100px]" title={transfer.sourceBranchName}>
                          {transfer.sourceBranchName}
                        </span>
                        <ArrowRightLeft size={14} className="text-gray-500 shrink-0" />
                        <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded truncate max-w-[100px]" title={transfer.destinationBranchName}>
                          {transfer.destinationBranchName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-white">
                      {transfer.quantity}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(transfer.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {transfer.status === 'PENDING' && (
                          <button
                            onClick={() => {
                              if(confirm('Mark this transfer as In Transit?')) {
                                inTransitMutation.mutate(transfer.id);
                              }
                            }}
                            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 p-2 rounded-lg transition-colors border border-blue-500/20"
                            title="Mark In Transit"
                          >
                            <Truck size={16} />
                          </button>
                        )}
                        {(transfer.status === 'PENDING' || transfer.status === 'IN_TRANSIT') && (
                          <button
                            onClick={() => {
                              if(confirm('Complete transfer? This will immediately move stock from Source to Destination branch.')) {
                                completeMutation.mutate(transfer.id);
                              }
                            }}
                            className="bg-green-500/20 hover:bg-green-500/30 text-green-400 p-2 rounded-lg transition-colors border border-green-500/20"
                            title="Complete Transfer"
                          >
                            <Flag size={16} />
                          </button>
                        )}
                        {(transfer.status === 'PENDING' || transfer.status === 'IN_TRANSIT') && (
                          <button
                            onClick={() => {
                              if(confirm('Are you sure you want to cancel this transfer?')) {
                                cancelMutation.mutate(transfer.id);
                              }
                            }}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg transition-colors border border-red-500/20"
                            title="Cancel Transfer"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-800 flex justify-between items-center bg-gray-950/30">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {isModalOpen && <StockTransferModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
