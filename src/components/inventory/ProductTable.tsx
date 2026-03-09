"use client";

import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, AlertTriangle, LayoutList } from "lucide-react";
import { Product } from "@/types/inventory";
import { formatCurrency } from "@/lib/utils";
import { SortableHeader, SortDirection } from "@/components/ui/SortableHeader";

interface ProductTableProps {
  data: Product[];
  isLoading: boolean;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onManageInventory?: (product: Product) => void;
  sortKey: string | null;
  sortDirection: SortDirection;
  onSort: (key: string, direction: SortDirection) => void;
}

export default function ProductTable({ 
  data, 
  isLoading, 
  totalPages, 
  currentPage, 
  onPageChange,
  onEdit,
  onDelete,
  onManageInventory,
  sortKey,
  sortDirection,
  onSort,
}: ProductTableProps) {
  if (isLoading) {
    return <div className="py-20 text-center text-gray-400">Loading products...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-800 hover:bg-transparent bg-gray-800/20">
              <SortableHeader
                label="Product"
                sortKey="name"
                currentSort={sortKey}
                currentDirection={sortDirection}
                onSort={onSort}
                className="py-4"
              />
              <TableHead className="text-gray-400 font-semibold">SKU</TableHead>
              <TableHead className="text-gray-400 font-semibold">Category</TableHead>
              <SortableHeader
                label="Price"
                sortKey="basePrice"
                currentSort={sortKey}
                currentDirection={sortDirection}
                onSort={onSort}
                className="text-right"
              />
              <SortableHeader
                label="Stock"
                sortKey="stockQuantity"
                currentSort={sortKey}
                currentDirection={sortDirection}
                onSort={onSort}
                className="text-center"
              />
              <TableHead className="text-gray-400 font-semibold">Status</TableHead>
              <TableHead className="text-gray-400 font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((product) => (
              <TableRow key={product.id} className="border-gray-800 hover:bg-gray-800/40 transition-colors group">
                <TableCell className="py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center text-gray-600 font-bold overflow-hidden border border-gray-700">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        product.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-white">{product.name}</div>
                      <div className="text-xs text-gray-400">{product.brandName || 'No Brand'}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-gray-300 font-mono text-xs">{product.sku}</TableCell>
                <TableCell>
                  <span className="text-gray-400 text-sm bg-gray-800/50 px-2 py-1 rounded">
                    {product.categoryName || 'Uncategorized'}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium text-emerald-400">
                  {formatCurrency(product.basePrice)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center">
                    <span className={product.stockQuantity <= product.lowStockThreshold ? 'text-red-400 font-bold' : 'text-gray-300'}>
                      {product.stockQuantity}
                    </span>
                    {product.stockQuantity <= product.lowStockThreshold && (
                      <span className="text-[10px] text-red-500 font-semibold flex items-center gap-0.5">
                        <AlertTriangle size={10} /> LOW
                      </span>
                    )}
                    
                    {/* Branch Breakdown */}
                    {product.stockLevels && product.stockLevels.length > 1 && (
                      <div className="mt-1 pt-1 border-t border-gray-800 w-full hidden group-hover:block transition-all duration-200">
                        {product.stockLevels.map((sl) => (
                           <div key={sl.id} className="text-[10px] text-gray-500 flex justify-between gap-2 px-2">
                             <span>{sl.branchName}:</span>
                             <span className="font-mono">{sl.quantity}</span>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {product.isActive ? (
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                  ) : (
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                  )}
                  <span className="text-xs text-gray-400">{product.isActive ? 'Active' : 'Inactive'}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-primary hover:text-indigo-300 hover:bg-primary/10"
                      onClick={() => onManageInventory?.(product)}
                      title="Adjust Inventory"
                    >
                      <LayoutList size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
                      onClick={() => onEdit?.(product)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-400/10"
                      onClick={() => onDelete?.(product)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 py-4">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage === 0}
            onClick={() => onPageChange(currentPage - 1)}
            className="border-gray-800 bg-gray-900 text-gray-400 hover:text-white"
          >
            Previous
          </Button>
          <div className="flex items-center px-4 text-sm text-gray-400">
             Page {currentPage + 1} of {totalPages}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage + 1 >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="border-gray-800 bg-gray-900 text-gray-400 hover:text-white"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
