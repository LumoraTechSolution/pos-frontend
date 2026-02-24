'use client';

import { Package, ShoppingBag, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface POSHeaderProps {
  userName: string;
  userRole: string;
  onShiftSummary: () => void;
  onLogout: () => void;
}

export function POSHeader({ userName, userRole, onShiftSummary, onLogout }: POSHeaderProps) {
  return (
    <div className="h-16 bg-gray-900/50 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Package className="text-white" size={18} />
        </div>
        <h1 className="text-xl font-bold tracking-tight">
          Lumora<span className="text-indigo-400">POS</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onShiftSummary}
          className="hidden sm:flex bg-gray-950 border-gray-800 hover:bg-gray-800 text-gray-400 gap-2 h-9 rounded-lg"
        >
          <ShoppingBag size={16} /> Shift Summary
        </Button>

        <div className="flex items-center gap-6 border-l border-gray-800 pl-4 ml-2">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-medium text-white">{userName}</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest">
              Terminal #01 • {userRole}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout} className="text-gray-400 hover:text-red-400">
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
