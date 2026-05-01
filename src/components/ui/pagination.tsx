"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-gray-800 bg-gray-900/50 text-gray-400 hover:text-primary hover:border-primary/50 transition-all"
          disabled={currentPage === 0 || isLoading}
          onClick={() => onPageChange(0)}
        >
          <ChevronsLeft size={16} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-gray-800 bg-gray-900/50 text-gray-400 hover:text-primary hover:border-primary/50 transition-all"
          disabled={currentPage === 0 || isLoading}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft size={16} />
        </Button>
      </div>

      <div className="flex items-center px-4 py-1 rounded-md bg-gray-900/80 border border-gray-800 shadow-inner">
        <span className="text-xs font-mono tracking-wider tabular-nums">
          <span className="text-primary font-bold">{currentPage + 1}</span>
          <span className="text-gray-600 mx-2">/</span>
          <span className="text-gray-400">{totalPages}</span>
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-gray-800 bg-gray-900/50 text-gray-400 hover:text-primary hover:border-primary/50 transition-all"
          disabled={currentPage + 1 >= totalPages || isLoading}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight size={16} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-gray-800 bg-gray-900/50 text-gray-400 hover:text-primary hover:border-primary/50 transition-all"
          disabled={currentPage + 1 >= totalPages || isLoading}
          onClick={() => onPageChange(totalPages - 1)}
        >
          <ChevronsRight size={16} />
        </Button>
      </div>
    </div>
  );
}
