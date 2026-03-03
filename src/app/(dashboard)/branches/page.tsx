"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { branchService, Branch, BranchRequest } from "@/services/branchService";
import { Button } from "@/components/ui/button";
import { Plus, Store, Info } from "lucide-react";
import BranchTable from "@/components/branches/BranchTable";
import BranchFormModal from "@/components/branches/BranchForm";
import { toast } from "sonner";

export default function BranchesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch branches
  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchService.getAllBranches(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: BranchRequest) => branchService.createBranch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success("Branch created successfully");
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create branch");
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; request: BranchRequest }) => 
      branchService.updateBranch(data.id, data.request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success("Branch updated successfully");
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update branch");
    }
  });

  const handleSubmit = (data: BranchRequest) => {
    if (selectedBranch) {
      updateMutation.mutate({ id: selectedBranch.id, request: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBranch(null);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Store className="text-indigo-500" size={24} />
            <h1 className="text-3xl font-bold tracking-tight">Branches</h1>
          </div>
          <p className="text-muted-foreground">Manage your physical store locations and warehouses.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus size={18} /> Add Branch
        </Button>
      </div>

      <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 flex gap-3 items-start">
        <Info className="text-indigo-400 shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-indigo-300/80 leading-relaxed">
          Branches allow you to track inventory across different physical sites. Each transaction at the POS 
          terminal should be associated with a branch to ensure stock is deducted from the correct location.
        </p>
      </div>

      <BranchTable 
        data={branches || []} 
        isLoading={isLoading} 
        onEdit={handleEdit}
      />

      <BranchFormModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        initialData={selectedBranch}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
