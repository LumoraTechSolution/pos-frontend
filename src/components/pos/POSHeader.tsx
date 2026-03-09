'use client';

import { useState } from 'react';
import { Package, ShoppingBag, LogOut, Store, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Branch } from '@/services/branchService';
import { cn } from '@/lib/utils';
import { TimeClockWidget } from '@/components/employee/TimeClockWidget';

interface POSHeaderProps {
  userName: string;
  userRole: string;
  branches: Branch[];
  selectedBranch: Branch | null;
  onBranchChange: (branch: Branch) => void;
  onShiftSummary: () => void;
  onLogout: () => void;
}

export function POSHeader({ 
  userName, 
  userRole, 
  branches, 
  selectedBranch, 
  onBranchChange, 
  onShiftSummary, 
  onLogout 
}: POSHeaderProps) {
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);

  return (
    <div className="relative z-50 h-16 bg-gray-900/50 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Package className="text-white" size={18} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Lumora<span className="text-primary">POS</span>
          </h1>
        </div>

        {/* Branch Selector */}
        {branches.length > 0 && (
          <div className="relative border-l border-gray-800 pl-6 ml-2 block">
            <button 
              onClick={() => setIsBranchMenuOpen(!isBranchMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 hover:border-primary/50 transition-colors group"
            >
              <Store size={14} className="text-primary" />
              <div className="flex flex-col items-start leading-none gap-0.5">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Store Location</span>
                <span className="text-sm font-semibold text-gray-200">
                  {selectedBranch?.name || 'Select Branch'}
                </span>
              </div>
              <ChevronDown size={14} className={cn("text-gray-500 transition-transform duration-200", isBranchMenuOpen && "rotate-180")} />
            </button>

            {isBranchMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsBranchMenuOpen(false)} />
                <div className="absolute top-full left-6 mt-2 w-56 bg-gray-950 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                  {branches.map((branch) => (
                    <button
                      key={branch.id}
                      onClick={() => {
                        onBranchChange(branch);
                        setIsBranchMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-gray-900",
                        selectedBranch?.id === branch.id ? "text-primary bg-primary/5" : "text-gray-400"
                      )}
                    >
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="font-semibold">{branch.name}</span>
                        <span className="text-[10px] opacity-70 truncate max-w-[150px]">{branch.address}</span>
                      </div>
                      {selectedBranch?.id === branch.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {userRole !== 'ADMIN' && <TimeClockWidget variant="header" />}
        
        <Button
          variant="outline"
          onClick={onShiftSummary}
          className="hidden lg:flex bg-gray-950 border-gray-800 hover:bg-gray-800 text-gray-400 gap-2 h-9 rounded-lg"
        >
          <ShoppingBag size={16} /> Shift Summary
        </Button>

        <div className="flex items-center gap-6 border-l border-gray-800 pl-4 ml-2">
          <div className="hidden md:flex flex-col items-end leading-tight">
            <span className="text-sm font-semibold text-white">{userName}</span>
            <span className="text-[10px] text-primary/70 font-bold uppercase tracking-widest">
              {userRole}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout} className="text-gray-400 hover:text-red-400 h-9 w-9 rounded-lg hover:bg-red-400/10 transition-all">
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
