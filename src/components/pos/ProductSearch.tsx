'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ProductSearchProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function ProductSearch({ search, onSearchChange }: ProductSearchProps) {
  return (
    <div className="p-4 bg-black">
      <div className="relative group">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors"
          size={20}
        />
        <Input
          type="text"
          placeholder="Search by product name, SKU, or scan barcode..."
          className="w-full pl-12 pr-4 py-6 bg-gray-900/50 border-gray-800 focus:border-indigo-500/50 focus:ring-indigo-500/20 text-lg rounded-2xl"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          autoFocus
        />
      </div>
    </div>
  );
}
