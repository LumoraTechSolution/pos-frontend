"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supplierService } from "@/services/supplierService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Edit2, ShieldAlert, Loader2 } from "lucide-react";
import { SupplierModal } from "./SupplierModal";
import { toast } from "sonner";

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["suppliers", page, searchTerm],
    queryFn: () => supplierService.getSuppliers(page, 10, { search: searchTerm }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supplierService.deleteSupplier(id),
    onSuccess: () => {
      toast.success("Supplier deactivated successfully");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to deactivate supplier");
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to deactivate this supplier?")) {
      deleteMutation.mutate(id);
    }
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
                data?.content.map((supplier) => (
                  <TableRow key={supplier.id} className="border-gray-800 group hover:bg-white/5 transition-colors">
                    <TableCell className="font-medium text-gray-200">
                      {supplier.name}
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
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          (supplier.isActive ?? (supplier as any).active)
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {(supplier.isActive ?? (supplier as any).active) ? "Active" : "Inactive"}
                      </span>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-400 hover:bg-gray-800"
                        onClick={() => handleDelete(supplier.id)}
                        disabled={!(supplier.isActive ?? (supplier as any).active)}
                      >
                        <ShieldAlert className="h-4 w-4" />
                      </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
