"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taxService, TaxRate, TaxRateRequest } from "@/services/taxService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  Percent,
  Shield,
  Star,
  Loader2,
  Info,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<TaxRate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TaxRate | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formRate, setFormRate] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);

  const { data: taxRates, isLoading } = useQuery({
    queryKey: ["tax-rates"],
    queryFn: taxService.getAllTaxRates,
  });

  const createMutation = useMutation({
    mutationFn: (data: TaxRateRequest) => taxService.createTaxRate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-rates"] });
      toast.success("Tax rate created successfully");
      closeModal();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create tax rate"
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaxRateRequest }) =>
      taxService.updateTaxRate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-rates"] });
      toast.success("Tax rate updated successfully");
      closeModal();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update tax rate"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => taxService.deleteTaxRate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-rates"] });
      toast.success("Tax rate deleted");
      setDeleteConfirm(null);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete tax rate"
      );
    },
  });

  const openCreate = () => {
    setEditingRate(null);
    setFormName("");
    setFormRate("");
    setFormDescription("");
    setFormIsDefault(false);
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEdit = (rate: TaxRate) => {
    setEditingRate(rate);
    setFormName(rate.name);
    setFormRate(rate.ratePercent.toString());
    setFormDescription(rate.description || "");
    setFormIsDefault(rate.isDefault);
    setFormIsActive(rate.isActive);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRate(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: TaxRateRequest = {
      name: formName,
      rate: parseFloat(formRate),
      description: formDescription || undefined,
      isDefault: formIsDefault,
      isActive: formIsActive,
    };

    if (editingRate) {
      updateMutation.mutate({ id: editingRate.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Stats
  const activeCount = taxRates?.filter((r) => r.isActive).length || 0;
  const defaultRate = taxRates?.find((r) => r.isDefault);

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="text-primary" size={24} />
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Configure your business rules and system preferences.
          </p>
        </div>
      </div>

      {/* Tax Configuration Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="text-primary" size={20} />
            <h2 className="text-xl font-semibold text-white">
              Tax Configuration
            </h2>
          </div>
          <Button
            onClick={openCreate}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus size={18} /> Add Tax Rate
          </Button>
        </div>

        {/* Info Banner */}
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex gap-3 items-start">
          <Info className="text-primary shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-indigo-300/80 leading-relaxed space-y-1">
            <p>
              Tax rates are applied to products based on their category. Assign
              a tax rate to a category, and all products in that category will
              use it.
            </p>
            <p className="text-primary/60">
              <strong>Resolution Order:</strong> Product Category Tax Rate →
              Default Tax Rate → 0% (tax-exempt)
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-950 border-gray-800">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Percent className="text-primary" size={22} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Rates
                </p>
                <p className="text-2xl font-bold text-white">
                  {taxRates?.length || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-950 border-gray-800">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Shield className="text-emerald-400" size={22} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Rates
                </p>
                <p className="text-2xl font-bold text-white">{activeCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-950 border-gray-800">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Star className="text-amber-400" size={22} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Default Rate
                </p>
                <p className="text-2xl font-bold text-white">
                  {defaultRate
                    ? `${defaultRate.ratePercent}%`
                    : "Not Set"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tax Rates Table */}
        <Card className="bg-gray-950 border-gray-800 overflow-hidden">
          <CardHeader className="bg-gray-900/30 border-b border-gray-800 pb-4">
            <CardTitle className="text-base font-semibold text-gray-300">
              Tax Rates Registry
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-black/20">
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest pl-6">
                    Name
                  </TableHead>
                  <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                    Rate
                  </TableHead>
                  <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                    Description
                  </TableHead>
                  <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                    Status
                  </TableHead>
                  <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                    Type
                  </TableHead>
                  <TableHead className="text-right text-gray-400 font-bold uppercase text-[10px] tracking-widest pr-6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Loader2
                          className="animate-spin text-primary"
                          size={28}
                        />
                        <p className="text-sm font-medium">
                          Loading tax rates...
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !taxRates || taxRates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Percent size={40} className="opacity-10" />
                        <p className="text-sm font-medium">
                          No tax rates configured yet
                        </p>
                        <Button
                          variant="link"
                          className="text-primary"
                          onClick={openCreate}
                        >
                          Create your first tax rate
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  taxRates.map((rate) => (
                    <TableRow
                      key={rate.id}
                      className="border-gray-800 hover:bg-white/5 transition-colors group"
                    >
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold",
                              rate.isActive
                                ? "bg-primary/10 text-primary"
                                : "bg-gray-800 text-gray-500"
                            )}
                          >
                            %
                          </div>
                          <span className="font-semibold text-white">
                            {rate.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-lg font-black text-primary">
                          {rate.ratePercent}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-400">
                          {rate.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            rate.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-gray-800 text-gray-400"
                          )}
                        >
                          {rate.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {rate.isDefault ? (
                          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1">
                            <Star size={12} fill="currentColor" /> Default
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Standard
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            onClick={() => openEdit(rate)}
                          >
                            <Edit2 size={15} />
                          </Button>
                          {!rate.isDefault && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => setDeleteConfirm(rate)}
                            >
                              <Trash2 size={15} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[425px] bg-gray-950 border-gray-800 text-gray-200">
          <DialogHeader>
            <DialogTitle>
              {editingRate ? "Edit Tax Rate" : "Create Tax Rate"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingRate
                ? "Update the tax rate details below."
                : "Define a new tax rate for your business."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Name <span className="text-red-400">*</span>
              </label>
              <Input
                value={formName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormName(e.target.value)
                }
                placeholder="e.g. GST, VAT, Sales Tax"
                className="bg-gray-900 border-gray-800"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Rate (%) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formRate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormRate(e.target.value)
                  }
                  placeholder="e.g. 10"
                  className="bg-gray-900 border-gray-800 pr-10"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                  %
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                Enter as percentage. e.g. 10 for 10%, 5.5 for 5.5%.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Description
              </label>
              <Input
                value={formDescription}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormDescription(e.target.value)
                }
                placeholder="Optional description"
                className="bg-gray-900 border-gray-800"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-800 p-4">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-gray-200">
                  Default Rate
                </label>
                <p className="text-xs text-gray-400">
                  Applied when a product's category has no specific tax rate.
                </p>
              </div>
              <input
                type="checkbox"
                className="w-5 h-5 accent-primary rounded"
                checked={formIsDefault}
                onChange={(e) => setFormIsDefault(e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-800 p-4">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-gray-200">
                  Active
                </label>
                <p className="text-xs text-gray-400">
                  Inactive tax rates won't be applied to any sales.
                </p>
              </div>
              <input
                type="checkbox"
                className="w-5 h-5 accent-primary rounded"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formName || !formRate}
                className="bg-primary hover:bg-primary/90 min-w-[120px]"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editingRate ? "Save Changes" : "Create Rate"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent className="sm:max-w-[400px] bg-gray-950 border-gray-800 text-gray-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle size={20} /> Delete Tax Rate
            </DialogTitle>
            <DialogDescription className="text-gray-400 pt-2">
              Are you sure you want to delete{" "}
              <span className="text-white font-semibold">
                {deleteConfirm?.name}
              </span>
              ? This action cannot be undone. Products using this rate will fall
              back to the default tax.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirm(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteConfirm && deleteMutation.mutate(deleteConfirm.id)
              }
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete Tax Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
