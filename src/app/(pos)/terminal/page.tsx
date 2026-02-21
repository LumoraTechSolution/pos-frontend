'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { inventoryService } from '@/services/inventoryService';
import { SaleResponse, salesService, SaleRequest, SalesSummaryResponse } from '@/services/salesService';
import { useCart } from '@/hooks/useCart';
import { Search, ShoppingCart, Trash2, Plus, Minus, LogOut, Package, CreditCard, Banknote, QrCode, Loader2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Receipt } from '@/components/pos/Receipt';
import { ShiftSummary } from '@/components/pos/ShiftSummary';
import { CustomerSelector } from '@/components/pos/CustomerSelector';
import { Customer } from '@/services/customerService';

export default function TerminalPage() {
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'ONLINE'>('CASH');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [lastSale, setLastSale] = useState<SaleResponse | null>(null);
  const [summary, setSummary] = useState<SalesSummaryResponse | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { items, addToCart, updateQuantity, removeFromCart, clearCart, subtotal, taxAmount, total, itemCount } = useCart();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => inventoryService.getProducts(0, 50),
  });

  const checkoutMutation = useMutation({
    mutationFn: (data: SaleRequest) => salesService.createSale(data),
    onSuccess: (data) => {
      toast.success(`Sale Processed: ${data.invoiceNumber}`);
      setLastSale(data);
      setSelectedCustomer(null);
      clearCart();
      // Small timeout to allow state to react before printing
      setTimeout(() => {
        window.print();
      }, 500);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to process sale");
    }
  });

  const handleCheckout = () => {
    if (items.length === 0) return;

    const saleRequest: SaleRequest = {
      customerId: selectedCustomer?.id,
      paymentMethod: paymentMethod,
      items: items.map(item => ({
        productId: item.id,
        quantity: item.cartQuantity,
        unitPrice: item.basePrice,
        discountAmount: 0
      }))
    };

    checkoutMutation.mutate(saleRequest);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const products = productsData?.content || [];
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search)
  );

  const handleFetchSummary = async () => {
    try {
      const data = await salesService.getDailySummary();
      setSummary(data);
      setShowSummary(true);
    } catch (error) {
      toast.error("Failed to load shift summary");
    }
  };

  return (
    <div className="h-screen flex bg-black overflow-hidden font-sans">
      {/* Left Side — Product Section */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* POS Header */}
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
              onClick={handleFetchSummary}
              className="hidden sm:flex bg-gray-950 border-gray-800 hover:bg-gray-800 text-gray-400 gap-2 h-9 rounded-lg"
            >
              <ShoppingBag size={16} /> Shift Summary
            </Button>
            
            <div className="flex items-center gap-6 border-l border-gray-800 pl-4 ml-2">
              <div className="hidden md:flex flex-col items-end">
                 <span className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</span>
                 <span className="text-[10px] text-gray-500 uppercase tracking-widest">Terminal #01 • {user?.roles?.[0]}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-400 hover:text-red-400">
                 <LogOut size={18} />
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar Area */}
        <div className="p-4 bg-black">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
            <Input
              type="text"
              placeholder="Search by product name, SKU, or scan barcode..."
              className="w-full pl-12 pr-4 py-6 bg-gray-900/50 border-gray-800 focus:border-indigo-500/50 focus:ring-indigo-500/20 text-lg rounded-2xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-4 pt-0 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
               <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3">
               <Package size={48} className="opacity-20" />
               <p>No products found matching "{search}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id}
                  className="bg-gray-900 border-gray-800 hover:border-indigo-500/50 hover:bg-gray-800/50 transition-all cursor-pointer group active:scale-[0.98]"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-square bg-gray-950 relative overflow-hidden flex items-center justify-center">
                       {product.imageUrl ? (
                         <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
                       ) : (
                         <Package className="text-gray-800" size={40} />
                       )}
                       <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors" />
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-white text-sm line-clamp-1 group-hover:text-indigo-400 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-indigo-400 font-bold">${product.basePrice.toFixed(2)}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${product.stockQuantity < 10 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {product.stockQuantity} in stock
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Side — Cart Section */}
      <div className="w-[400px] bg-gray-900/40 backdrop-blur-xl border-l border-gray-800 flex flex-col shadow-2xl">
        <div className="h-16 border-b border-gray-800 flex items-center px-6">
          <ShoppingCart className="text-indigo-400 mr-2" size={20} />
          <h2 className="font-bold text-lg text-white">Current Sale</h2>
          <div className="ml-auto bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded text-xs font-bold">
            {itemCount} ITEMS
          </div>
        </div>

        <div className="px-4 py-3 border-b border-gray-800/50">
          <CustomerSelector 
            selectedCustomer={selectedCustomer} 
            onSelect={setSelectedCustomer} 
          />
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 italic gap-2">
               <ShoppingCart size={40} className="opacity-10" />
               <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="bg-gray-900 border border-gray-800/50 rounded-xl p-3 flex gap-3 animate-in fade-in slide-in-from-right-2 duration-200">
                <div className="w-12 h-12 bg-gray-950 rounded-lg flex items-center justify-center shrink-0">
                  {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover rounded-lg" /> : <Package size={20} className="text-gray-700" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-medium text-white truncate pr-2">{item.name}</h4>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center bg-gray-950 border border-gray-800 rounded-lg overflow-hidden">
                      <button 
                        onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}
                        className="p-1.5 hover:bg-gray-800 text-gray-400"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-white">{item.cartQuantity}</span>
                      <button 
                         onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}
                         className="p-1.5 hover:bg-gray-800 text-gray-400"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="font-bold text-sm text-white">${(item.basePrice * item.cartQuantity).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Summary */}
        <div className="bg-gray-900/60 border-t border-gray-800 p-6 space-y-5">
          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-2">
             <button 
               onClick={() => setPaymentMethod('CASH')}
               className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${paymentMethod === 'CASH' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-gray-950 border-gray-800 text-gray-500 hover:bg-gray-800'}`}
             >
                <Banknote size={18} className="mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Cash</span>
             </button>
             <button 
                onClick={() => setPaymentMethod('CARD')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${paymentMethod === 'CARD' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-gray-950 border-gray-800 text-gray-500 hover:bg-gray-800'}`}
             >
                <CreditCard size={18} className="mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Card</span>
             </button>
             <button 
                onClick={() => setPaymentMethod('ONLINE')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${paymentMethod === 'ONLINE' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-gray-950 border-gray-800 text-gray-500 hover:bg-gray-800'}`}
             >
                <QrCode size={18} className="mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Online</span>
             </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-300 font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax (10%)</span>
              <span className="text-gray-300 font-medium">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-black pt-3 border-t border-gray-800/50">
              <span className="text-white">TOTAL</span>
              <span className="text-indigo-400">${total.toFixed(2)}</span>
            </div>
          </div>
          
          <Button 
            onClick={handleCheckout}
            className="w-full h-16 bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 text-white font-bold text-xl rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none group"
            disabled={items.length === 0 || checkoutMutation.isPending}
          >
            {checkoutMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={20} /> PROCESSING...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                COMPLETE SALE <ShoppingCart size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-transparent border-gray-800 text-gray-400 hover:bg-gray-800 h-10 rounded-xl" onClick={() => {}}>
              Hold Sale
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent border-red-900/10 text-red-500/50 hover:bg-red-950/20 hover:text-red-400 h-10 rounded-xl" onClick={items.length > 0 ? () => { if(confirm('Discard current sale?')) clearCart(); } : undefined}>
              Discard
            </Button>
          </div>
        </div>
      </div>

      {/* Shift Summary Modal */}
      {showSummary && (
        <ShiftSummary 
          summary={summary} 
          onClose={() => setShowSummary(false)} 
        />
      )}

      {/* Hidden Receipt for Printing */}
      <div className="hidden">
        <div id="receipt-print">
          <Receipt sale={lastSale} />
        </div>
      </div>
    </div>
  );
}
