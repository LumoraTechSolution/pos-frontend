"use client";

import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventoryService";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import ProductTable from "@/components/inventory/ProductTable";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Product } from "@/types/inventory";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', page],
    queryFn: () => inventoryService.getProducts(page)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
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

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your inventory, pricing, and stock levels.</p>
        </div>
        <Link href="/inventory/products/new">
          <Button className="gap-2">
            <Plus size={18} /> Add Product
          </Button>
        </Link>
      </div>

      <div className="flex gap-4 items-center bg-gray-900/50 p-4 rounded-xl border border-gray-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search products by name or SKU..." 
            className="pl-10 bg-gray-950 border-gray-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2 border-gray-800 bg-gray-950">
          <Filter size={18} /> Filters
        </Button>
      </div>

      <ProductTable 
        data={productsData?.content || []} 
        isLoading={isLoading}
        totalPages={productsData?.totalPages || 1}
        currentPage={page}
        onPageChange={setPage}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
