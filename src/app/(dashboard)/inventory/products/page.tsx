"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService, ProductFilters } from "@/services/inventoryService";
import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, X, Upload, Download, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import ProductTable from "@/components/inventory/ProductTable";
import ImportProductsModal from "@/components/inventory/ImportProductsModal";
import InventoryAdjustmentModal from "@/components/inventory/InventoryAdjustmentModal";
import Link from "next/link";
import { Product } from "@/types/inventory";
import { useRouter } from "next/navigation";
import { SortDirection } from "@/components/ui/SortableHeader";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";

export default function ProductsPage() {
  const { user: currentUser } = useAuthStore();
  const maxProducts = currentUser?.maxProducts || 500;
  
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [brandId, setBrandId] = useState<string>("");
  const [isActive, setIsActive] = useState<string>("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [productForAdjustment, setProductForAdjustment] = useState<Product | null>(null);

  const queryClient = useQueryClient();
  const router = useRouter();

  // Debounce search input
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    // Reset to page 0 on search
    setPage(0);
    // Simple debounce
    const timeout = setTimeout(() => setDebouncedSearch(value), 300);
    return () => clearTimeout(timeout);
  }, []);

  // Build filters object
  const filters: ProductFilters = useMemo(() => ({
    search: debouncedSearch || undefined,
    categoryId: categoryId || undefined,
    brandId: brandId || undefined,
    isActive: isActive === '' ? undefined : isActive === 'true',
    sort: sortKey && sortDirection ? `${sortKey},${sortDirection}` : undefined,
  }), [debouncedSearch, categoryId, brandId, isActive, sortKey, sortDirection]);

  // Fetch products with filters
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', page, filters],
    queryFn: () => inventoryService.getProducts(page, 20, filters),
  });

  const totalElements = productsData?.totalElements || 0;
  const isLimitReached = totalElements >= maxProducts;

  // Fetch categories and brands for filter dropdowns
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => inventoryService.getCategories(),
  });

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: () => inventoryService.getBrands(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Product deleted");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete product");
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => inventoryService.toggleStatus(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', data.id] });
      toast.success(`${data.name} is now ${data.isActive ? 'Active' : 'Inactive'}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  });

  const handleEdit = (product: Product) => {
    router.push(`/inventory/products/${product.id}`);
  };

  const handleDelete = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  const handleManageInventory = (product: Product) => {
    setProductForAdjustment(product);
    setIsAdjustmentModalOpen(true);
  };

  const handleToggleStatus = (product: Product) => {
    toggleStatusMutation.mutate(product.id);
  };

  const handleSort = (key: string, direction: SortDirection) => {
    setSortKey(direction ? key : null);
    setSortDirection(direction);
    setPage(0);
  };

  const hasActiveFilters = categoryId || brandId || isActive !== '';

  const clearFilters = () => {
    setCategoryId("");
    setBrandId("");
    setIsActive("");
    setSearch("");
    setDebouncedSearch("");
    setPage(0);
  };

  // Scan-to-Onboard: Fast product lookup via scanner that redirects to Edit or Create
  useBarcodeScanner({
    onScan: async (barcode) => {
      try {
        const product = await inventoryService.lookupByCode(barcode);
        if (!product.isActive) {
          toast.warning(`Note: ${product.name} is currently INACTIVE. Opening to reactivate.`);
        } else {
          toast.info(`Existing product found: ${product.name}. Opening editor.`);
        }
        router.push(`/inventory/products/${product.id}`);
      } catch (err: any) {
        // Check quota before redirecting to creation form
        if (isLimitReached) {
          toast.error("Product limit reached. Cannot onboard new barcode.", {
            description: `You have reached your limit of ${maxProducts} products.`
          });
          return;
        }
        
        toast.success("New product detected! Redirecting to onboard.");
        router.push(`/inventory/products/new?barcode=${encodeURIComponent(barcode)}`);
      }
    }
  });

  return (
    <div className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Manage your inventory, pricing, and stock levels.
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${isLimitReached ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
               {totalElements} / {maxProducts} Products
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-primary" />
              Scanner Active
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2 border-gray-800"
            onClick={() => inventoryService.exportProducts()}
          >
            <Download size={18} /> Export
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 border-gray-800"
            onClick={() => setIsImportModalOpen(true)}
          >
            <Upload size={18} /> Import
          </Button>
          <div className="flex flex-col items-end gap-1">
             <Link href={isLimitReached ? "#" : "/inventory/products/new"}>
               <Button 
                 disabled={isLimitReached}
                 className="gap-2 bg-primary hover:bg-primary/90"
               >
                 {isLimitReached ? <Shield size={18} className="text-amber-400" /> : <Plus size={18} />}
                 Add Product
               </Button>
             </Link>
             {isLimitReached && (
                <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Quota Exceeded
                </span>
             )}
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="space-y-3">
        <div className="flex gap-4 items-center bg-gray-900/50 p-4 rounded-xl border border-gray-800">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search products by name or SKU..." 
              className="pl-10 bg-gray-950 border-gray-800"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setPage(0); }}
            className="h-10 px-3 rounded-lg bg-gray-950 border border-gray-800 text-sm text-gray-300 focus:border-primary focus:outline-none min-w-[150px]"
          >
            <option value="">All Categories</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Brand Filter */}
          <select
            value={brandId}
            onChange={(e) => { setBrandId(e.target.value); setPage(0); }}
            className="h-10 px-3 rounded-lg bg-gray-950 border border-gray-800 text-sm text-gray-300 focus:border-primary focus:outline-none min-w-[150px]"
          >
            <option value="">All Brands</option>
            {brands?.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={isActive}
            onChange={(e) => { setIsActive(e.target.value); setPage(0); }}
            className="h-10 px-3 rounded-lg bg-gray-950 border border-gray-800 text-sm text-gray-300 focus:border-primary focus:outline-none min-w-[120px]"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-400 hover:text-white gap-1"
            >
              <X size={14} /> Clear
            </Button>
          )}
        </div>

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <div className="flex gap-2 flex-wrap">
            {categoryId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                Category: {categories?.find(c => c.id === categoryId)?.name}
                <button onClick={() => setCategoryId("")} className="hover:text-white"><X size={12} /></button>
              </span>
            )}
            {brandId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                Brand: {brands?.find(b => b.id === brandId)?.name}
                <button onClick={() => setBrandId("")} className="hover:text-white"><X size={12} /></button>
              </span>
            )}
            {isActive !== '' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
                Status: {isActive === 'true' ? 'Active' : 'Inactive'}
                <button onClick={() => setIsActive("")} className="hover:text-white"><X size={12} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      <ProductTable 
        data={productsData?.content || []} 
        isLoading={isLoading}
        totalPages={productsData?.totalPages || 1}
        currentPage={page}
        onPageChange={setPage}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onManageInventory={handleManageInventory}
        onToggleStatus={handleToggleStatus}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      <ImportProductsModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["products"] })}
      />

      <InventoryAdjustmentModal
        product={productForAdjustment}
        isOpen={isAdjustmentModalOpen}
        onClose={() => {
          setIsAdjustmentModalOpen(false);
          setProductForAdjustment(null);
        }}
      />
    </div>
  );
}
