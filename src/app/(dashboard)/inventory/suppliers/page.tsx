"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supplierService, Supplier, PagedSuppliers } from "@/services/supplierService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Edit2, Loader2 } from "lucide-react";
import { SupplierModal } from "./SupplierModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const isUndoRef = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ["suppliers", page, searchTerm],
    queryFn: () => supplierService.getSuppliers(page, 10, { search: searchTerm }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => supplierService.toggleStatus(id),
    onMutate: async (id) => {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });

      await queryClient.cancelQueries({ queryKey: ["suppliers"] });

      const snapshots = queryClient.getQueriesData<PagedSuppliers>({ queryKey: ["suppliers"] });

      queryClient.setQueriesData<PagedSuppliers>({ queryKey: ["suppliers"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          content: old.content.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)),
        };
      });

      const wasUndo = isUndoRef.current;
      isUndoRef.current = false;
      return { snapshots, wasUndo };
    },
    onError: (error: unknown, _id, context) => {
      context?.snapshots.forEach(([key, previous]) => {
        queryClient.setQueryData(key, previous);
      });
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed to update status"
      );
    },
    onSuccess: (updated, _id, context) => {
      if (context?.wasUndo) return;

      if (!updated.isActive) {
        toast.success(`${updated.name} deactivated`, {
          description: "It won't appear when creating new purchase orders.",
          action: {
            label: "Undo",
            onClick: () => {
              isUndoRef.current = true;
              toggleStatusMutation.mutate(updated.id);
            },
          },
        });
      } else {
        toast.success(`${updated.name} reactivated`);
      }
    },
    onSettled: (_data, _err, id) => {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });

  const handleToggleStatus = (supplier: Supplier) => {
    toggleStatusMutation.mutate(supplier.id);
  };

  return (
    <div className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Suppliers</h1>
          <p className="text-gray-400">Manage vendors and product suppliers</p>
        </div>
        <Button
          onClick={() => {
            setSelectedSupplier(null);
            setIsModalOpen(true);
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-6 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gray-950 border-gray-800"
            />
          </div>
        </div>

        <div className="rounded-md border border-gray-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-950/50">
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead>Supplier Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-500" />
                  </TableCell>
                </TableRow>
              ) : data?.content.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                    No suppliers found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.content.map((supplier) => {
                  const isToggling = togglingIds.has(supplier.id);
                  return (
                  <TableRow
                    key={supplier.id}
                    className={cn(
                      "border-gray-800 group hover:bg-white/5 transition-colors",
                      !supplier.isActive && "bg-gray-950/60"
                    )}
                  >
                    <TableCell className="font-medium">
                      <span
                        className={cn(
                          supplier.isActive
                            ? "text-gray-200"
                            : "text-gray-400 line-through decoration-gray-600"
                        )}
                      >
                        {supplier.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {supplier.contactPerson || "-"}
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {supplier.email || "-"}
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {supplier.phone || "-"}
                    </TableCell>
                    <TableCell className="py-4">
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() => handleToggleStatus(supplier)}
                        aria-label={`${supplier.isActive ? "Deactivate" : "Activate"} ${supplier.name}`}
                        aria-busy={isToggling}
                        title={
                          supplier.isActive
                            ? "Active — available when creating POs. Click to deactivate."
                            : "Inactive — hidden from PO creation. Click to reactivate."
                        }
                        className="flex items-center gap-2 rounded-md px-1 py-0.5 -mx-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-wait"
                      >
                        <Switch
                          checked={supplier.isActive}
                          disabled={isToggling}
                          className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-gray-700 border-gray-600 pointer-events-none"
                          tabIndex={-1}
                        />
                        <span
                          className={cn(
                            "text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border",
                            supplier.isActive
                              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                              : "text-gray-400 bg-gray-800 border-gray-700"
                          )}
                        >
                          {isToggling && <Loader2 size={11} className="animate-spin" />}
                          {supplier.isActive ? "Active" : "Inactive"}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="py-4 text-right pr-6">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-primary hover:bg-gray-800"
                          onClick={() => {
                            setSelectedSupplier(supplier);
                            setIsModalOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
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
              of <span className="font-medium text-gray-200">{data.totalElements}</span> suppliers
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

      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        supplier={selectedSupplier}
      />
    </div>
  );
}
