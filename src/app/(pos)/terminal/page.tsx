'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '@/services/inventoryService';
import { branchService, Branch } from '@/services/branchService';
import { taxService } from '@/services/taxService';
import { cashSessionService } from '@/services/cashSessionService';
import { tenantService } from '@/services/tenantService';
import { SaleResponse, salesService, SaleRequest, SalesSummaryResponse } from '@/services/salesService';
import { useCart, TaxContext } from '@/hooks/useCart';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { receiptPrinterService, ReceiptData } from '@/services/receiptPrinterService';
import { Customer } from '@/services/customerService';
import { performLogout } from '@/lib/performLogout';

// POS Components
import { POSHeader } from '@/components/pos/POSHeader';
import { ProductSearch } from '@/components/pos/ProductSearch';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { CartItemCard } from '@/components/pos/CartItemCard';
import { CheckoutPanel } from '@/components/pos/CheckoutPanel';
import { CustomerSelector } from '@/components/pos/CustomerSelector';
import { Receipt } from '@/components/pos/Receipt';
import { ShiftSummary } from '@/components/pos/ShiftSummary';
import { StartShiftModal } from '@/components/pos/StartShiftModal';
import InventoryAdjustmentModal from '@/components/inventory/InventoryAdjustmentModal';
import { Product } from '@/types/inventory';

export default function TerminalPage() {
  // State
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'ONLINE'>('CASH');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [lastSale, setLastSale] = useState<SaleResponse | null>(null);
  const [summary, setSummary] = useState<SalesSummaryResponse | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  // Drives the "Fix stock" recovery action on checkout-time OOS errors.
  const [stockFixProduct, setStockFixProduct] = useState<Product | null>(null);

  // Auth & Navigation
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Role gate — INVENTORY_MANAGER (or anyone without a sales-capable role) has no
  // business at the POS terminal. Bounce them to the dashboard.
  useEffect(() => {
    if (!user) return;
    const roles = user.roles || [];
    const canSell =
      roles.includes('ADMIN') ||
      roles.includes('MANAGER') ||
      roles.includes('CASHIER');
    if (!canSell) {
      router.replace('/overview');
    }
  }, [user, router]);

  // Cash session gate — terminal is unusable without an open drawer.
  const { data: activeSession, isLoading: sessionLoading } = useQuery({
    queryKey: ['cash-session-active'],
    queryFn: () => cashSessionService.getActive(),
    enabled: !!user && (user.roles || []).some(r => r === 'ADMIN' || r === 'MANAGER' || r === 'CASHIER'),
  });

  // Data Fetching
  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchService.getAllBranches(),
  });

  const branches = (branchesData || []).filter(b => b.isActive);

  // Fetch business info for the receipt header (name / address / phone).
  const { data: tenantInfo } = useQuery({
    queryKey: ['tenant-info'],
    queryFn: () => tenantService.getInfo(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch tax rates and categories for dynamic tax calculation
  const { data: activeTaxRates } = useQuery({
    queryKey: ['tax-rates-active'],
    queryFn: () => taxService.getActiveTaxRates(),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => inventoryService.getCategories(),
  });

  // Build the tax context for per-item tax resolution
  const taxContext: TaxContext | null = useMemo(() => {
    if (!activeTaxRates) return null;
    return {
      taxRates: activeTaxRates,
      categories: categories || [],
    };
  }, [activeTaxRates, categories]);

  // Since we are using TanStack Query v5, handle side effects in useEffect
  useEffect(() => {
    if (branches.length > 0 && !selectedBranch) {
      const defaultBranch = branches.find(b => b.isDefault) || branches[0];
      setSelectedBranch(defaultBranch);
    }
  }, [branches, selectedBranch]);

  // Cart — branch-aware so add/update reads the right stockLevels row.
  const { items, addToCart, updateQuantity, removeFromCart, clearCart, subtotal, taxAmount, taxLabel, total, itemCount } = useCart(taxContext, selectedBranch?.id);

  // Per-product cart quantities — fed to ProductGrid so it can show "at limit"
  // when a tile's cart count equals the branch stock.
  const cartQuantities = useMemo(
    () => items.reduce<Record<string, number>>((acc, item) => {
      acc[item.id] = item.cartQuantity;
      return acc;
    }, {}),
    [items]
  );

  // Data Fetching
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', search, 'active', selectedBranch?.id], // Branch-aware key
    queryFn: () => inventoryService.getProducts(0, 50, { isActive: true, search }),
  });

  const products = productsData?.content || [];
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search)
  );

  // Duplicate scan protection — prevents double-fire within 500ms
  const lastScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Global Barcode Scanner — Server-Side Lookup
  useBarcodeScanner({
    onScan: async (barcode) => {
      // Guard: ignore duplicate scans within 500ms (scanner double-fire)
      const now = Date.now();
      if (lastScanRef.current.code === barcode && now - lastScanRef.current.time < 500) {
        return;
      }
      lastScanRef.current = { code: barcode, time: now };

      try {
        const product = await inventoryService.lookupByCode(barcode, true);
        addToCart(product);
        toast.success(`Scanned: ${product.name}`);
      } catch (err: unknown) {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || `Barcode not found: ${barcode}`;
        toast.error(message);
      }
    }
  });

  // Checkout Mutation
  const checkoutMutation = useMutation({
    mutationFn: (data: SaleRequest) => salesService.createSale(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Sale Processed: ${data.invoiceNumber}`);
      setLastSale(data);
      setSelectedCustomer(null);
      clearCart(); // Also clear the cart on success
      
      // Fire Hardare integrations (Cash Drawer Kick + Thermal Receipt)
      const receiptData: ReceiptData = {
        tenantName: tenantInfo?.name || "StoreX",
        tenantAddressLine1: tenantInfo?.addressLine1 ?? undefined,
        tenantAddressLine2: tenantInfo?.addressLine2 ?? undefined,
        tenantPhone: tenantInfo?.phone ?? undefined,
        branchName: selectedBranch?.name || "Main Branch",
        showBranch: branches.length > 1,
        cashierName: `${user?.firstName} ${user?.lastName}`,
        transactionId: data.invoiceNumber,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        items: items.map(item => ({
          name: item.name,
          quantity: item.cartQuantity,
          price: item.basePrice,
          total: item.basePrice * item.cartQuantity
        })),
        subtotal: subtotal,
        tax: taxAmount,
        taxLabel: taxLabel,
        discount: 0,
        total: total,
        paymentMethod: paymentMethod,
        tendered: total, // exact-change assumption until a tender input lands
        change: 0
      };
      
      receiptPrinterService.processHardwareCheckoutActions(receiptData);
      clearCart();
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
        || "Failed to process sale";

      // Insufficient-stock errors get a recovery shortcut for managers/admins so
      // they can reconcile branch stock without leaving the terminal.
      const isStockError = /insufficient stock for product:\s*(.+?)(?:\s+in the selected branch)?$/i.exec(message);
      const roles = user?.roles || [];
      const canFixStock = roles.includes('ADMIN') || roles.includes('MANAGER');

      if (isStockError && canFixStock) {
        const productName = isStockError[1].trim();
        const cartProduct = items.find(i => i.name === productName);
        if (cartProduct) {
          toast.error(message, {
            action: {
              label: 'Fix stock',
              onClick: () => setStockFixProduct(cartProduct),
            },
          });
          return;
        }
      }

      toast.error(message);
    }
  });

  // Handlers
  const handleCheckout = () => {
    if (items.length === 0) return;
    checkoutMutation.mutate({
      customerId: selectedCustomer?.id,
      branchId: selectedBranch?.id,
      paymentMethod,
      items: items.map(item => ({
        productId: item.id,
        quantity: item.cartQuantity,
        unitPrice: item.basePrice,
        discountAmount: 0
      }))
    });
  };

  const handleLogout = async () => {
    await performLogout();
    router.push('/login');
  };

  const handleFetchSummary = async () => {
    try {
      const data = await salesService.getDailySummary();
      setSummary(data);
      setShowSummary(true);
    } catch {
      toast.error("Failed to load shift summary");
    }
  };

  const handleDiscard = () => {
    if (items.length > 0 && confirm('Discard current sale?')) {
      clearCart();
    }
  };

  // Render
  if (sessionLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <StartShiftModal
          open
          onCancel={() => router.push('/overview')}
        />
      </div>
    );
  }

  return (
    <>
      <div className="h-screen flex bg-black overflow-hidden font-sans print:hidden">
      {/* Left Side — Products */}
      <div className="flex-1 flex flex-col min-w-0">
        <POSHeader
          userName={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`}
          userRole={user?.roles?.[0] ?? ''}
          branches={branches}
          selectedBranch={selectedBranch}
          onBranchChange={setSelectedBranch}
          onShiftSummary={handleFetchSummary}
          onLogout={handleLogout}
        />
        <ProductSearch search={search} onSearchChange={setSearch} />
        <ProductGrid
          products={filteredProducts}
          isLoading={isLoading}
          searchTerm={search}
          onProductClick={addToCart}
          selectedBranchId={selectedBranch?.id}
          cartQuantities={cartQuantities}
        />
      </div>

      {/* Right Side — Cart */}
      <div className="w-[400px] bg-gray-900/40 backdrop-blur-xl border-l border-gray-800 flex flex-col shadow-2xl">
        {/* Cart Header */}
        <div className="h-16 border-b border-gray-800 flex items-center px-6">
          <ShoppingCart className="text-primary mr-2" size={20} />
          <h2 className="font-bold text-lg text-white">Current Sale</h2>
          <div className="ml-auto bg-primary/20 text-primary px-2 py-1 rounded text-xs font-bold">
            {itemCount} ITEMS
          </div>
        </div>

        {/* Customer Selector */}
        <div className="px-4 py-3 border-b border-gray-800/50">
          <CustomerSelector selectedCustomer={selectedCustomer} onSelect={setSelectedCustomer} />
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 italic gap-2">
              <ShoppingCart size={40} className="opacity-10" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            items.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))
          )}
        </div>

        {/* Checkout */}
        <CheckoutPanel
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          subtotal={subtotal}
          taxAmount={taxAmount}
          taxLabel={taxLabel}
          total={total}
          itemCount={itemCount}
          isProcessing={checkoutMutation.isPending}
          onCheckout={handleCheckout}
          onHoldSale={() => {}}
          onDiscard={handleDiscard}
        />
      </div>

      {/* Shift Summary Modal */}
      {showSummary && (
        <ShiftSummary summary={summary} onClose={() => setShowSummary(false)} />
      )}

      </div>

      {/* Stock Fix modal — opened from the checkout error toast's action */}
      {stockFixProduct && (
        <InventoryAdjustmentModal
          product={stockFixProduct}
          isOpen={!!stockFixProduct}
          onClose={() => {
            setStockFixProduct(null);
            queryClient.invalidateQueries({ queryKey: ['products'] });
          }}
          defaultBranchId={selectedBranch?.id}
          defaultType="RECONCILIATION"
        />
      )}

      {/* Hidden Receipt for Printing */}
      {lastSale && (
        <div className="hidden print:block print:absolute print:left-0 print:top-0 print:w-full print:bg-white print:text-black z-[9999]">
          <Receipt
            sale={lastSale}
            tenant={{
              name: tenantInfo?.name || 'StoreX',
              addressLine1: tenantInfo?.addressLine1 ?? undefined,
              addressLine2: tenantInfo?.addressLine2 ?? undefined,
              phone: tenantInfo?.phone ?? undefined,
            }}
            branch={selectedBranch}
            showBranch={branches.length > 1}
            taxLabel={taxLabel}
          />
        </div>
      )}
    </>
  );
}
