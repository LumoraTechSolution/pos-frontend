'use client';

import { Package, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Product } from '@/types/inventory';
import { CURRENCY } from '@/lib/utils';

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  searchTerm: string;
  onProductClick: (product: Product) => void;
  selectedBranchId?: string;
}

export function ProductGrid({ products, isLoading, searchTerm, onProductClick, selectedBranchId }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="flex-1 p-4 pt-0 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex-1 p-4 pt-0 flex flex-col items-center justify-center text-gray-500 gap-3">
        <Package size={48} className="opacity-20" />
        <p>No products found matching &quot;{searchTerm}&quot;</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 pt-0 overflow-y-auto custom-scrollbar">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((product) => {
          const displayStock = selectedBranchId && product.stockLevels
            ? (product.stockLevels.find(sl => sl.branchId === selectedBranchId)?.quantity || 0)
            : product.stockQuantity;

          return (
          <Card
            key={product.id}
            className="bg-gray-900 border-gray-800 hover:border-primary/50 hover:bg-gray-800/50 transition-all cursor-pointer group active:scale-[0.98]"
            onClick={() => onProductClick(product)}
          >
            <CardContent className="p-0">
              <div className="aspect-square bg-gray-950 relative overflow-hidden flex items-center justify-center">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
                ) : (
                  <Package className="text-gray-800" size={40} />
                )}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors" />
              </div>
              <div className="p-3">
                <h3 className="font-medium text-white text-sm line-clamp-1 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
                <div className="flex justify-between items-center">
                  <span className="text-primary font-bold">{CURRENCY.symbol} {product.basePrice.toFixed(2)}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      displayStock < 10
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-emerald-500/10 text-emerald-500'
                    }`}
                  >
                    {displayStock} in stock
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )})}
      </div>
    </div>
  );
}
