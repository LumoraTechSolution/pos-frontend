'use client';

import React, { useState } from 'react';
import { User, Search, Plus, X, UserPlus, Phone, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { customerService, Customer } from '@/services/customerService';
import { toast } from 'sonner';

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer | null) => void;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({ selectedCustomer, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (val: string) => {
    setSearch(val);
    if (val.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await customerService.getCustomers({ query: val });
      setResults(data.content);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  if (selectedCustomer) {
    return (
      <div className="flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl animate-in slide-in-from-top-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
            {selectedCustomer.firstName[0]}
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">
              {selectedCustomer.firstName} {selectedCustomer.lastName}
            </p>
            <div className="flex items-center gap-2">
               <span className="text-[10px] text-gray-400 flex items-center gap-1">
                 <Phone size={10} /> {selectedCustomer.phone || 'No phone'}
               </span>
               <span className="text-[10px] text-indigo-400 font-bold flex items-center gap-1">
                 <Star size={10} fill="currentColor" /> {selectedCustomer.loyaltyPoints} pts
               </span>
            </div>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onSelect(null)}
          className="h-8 w-8 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20"
        >
          <X size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      {!isOpen ? (
        <Button 
          onClick={() => setIsOpen(true)}
          className="w-full h-12 bg-gray-900 border-gray-800 text-gray-400 justify-start gap-3 hover:bg-gray-800 rounded-xl"
        >
          <UserPlus size={18} />
          <span className="text-sm">Add Customer to Sale</span>
        </Button>
      ) : (
        <div className="space-y-2 animate-in fade-in duration-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <Input 
              autoFocus
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-11 bg-gray-900 border-gray-800 focus:ring-indigo-500"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(false)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
            >
              <X size={16} />
            </Button>
          </div>

          {search.length >= 2 && (
            <Card className="absolute z-50 w-full mt-1 bg-gray-900 border-gray-800 shadow-2xl max-h-60 overflow-y-auto">
              <div className="p-1">
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
                ) : results.length > 0 ? (
                  results.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onSelect(c);
                        setIsOpen(false);
                      }}
                      className="w-full text-left p-3 hover:bg-gray-800 rounded-lg flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-800 group-hover:bg-indigo-600/20 rounded-full flex items-center justify-center text-xs font-bold text-gray-400 group-hover:text-indigo-400 transition-colors">
                          {c.firstName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{c.firstName} {c.lastName}</p>
                          <p className="text-[10px] text-gray-500">{c.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-indigo-400">{c.loyaltyPoints} pts</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500 mb-2">No customer found</p>
                    <Button size="sm" variant="outline" className="text-indigo-400 border-indigo-400/20 h-7 text-xs">
                      + Register New Customer
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
