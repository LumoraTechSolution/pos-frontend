"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  Bookmark, 
  Users, 
  UserSquare2, 
  BarChart3, 
  Settings,
  Monitor,
  LogOut,
  Store,
  Building2,
  Truck,
  ArrowRightLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { TimeClockWidget } from '@/components/employee/TimeClockWidget';
import AuthGuard from '@/components/providers/AuthGuard';
import { performLogout } from '@/lib/performLogout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hasFeature } = useAuthStore();

  const handleLogout = async () => {
    await performLogout();
    router.push('/login');
  };

  const navItems = [
    { label: 'Overview', href: '/overview', icon: LayoutDashboard },
    { label: 'Products', href: '/inventory/products', icon: Package, requiredFeature: 'INVENTORY' },
    { label: 'Categories', href: '/inventory/categories', icon: Tags, requiredFeature: 'INVENTORY' },
    { label: 'Brands', href: '/inventory/brands', icon: Bookmark, requiredFeature: 'INVENTORY' },
    { label: 'Customers', href: '/customers', icon: Users, requiredFeature: 'CUSTOMERS' },
    { label: 'Suppliers', href: '/inventory/suppliers', icon: Building2, requiredFeature: 'INVENTORY' },
    { label: 'Purchase Orders', href: '/inventory/purchase-orders', icon: Truck, requiredFeature: 'PURCHASE_ORDERS' },
    { label: 'Stock Transfers', href: '/inventory/stock-transfers', icon: ArrowRightLeft, requiredFeature: 'STOCK_TRANSFERS' },
    { label: 'Employees', href: '/employees', icon: UserSquare2, requiredFeature: 'EMPLOYEES' },
    { label: 'Reports', href: '/reports', icon: BarChart3, requiredFeature: 'REPORTS' },
    { label: 'Branches', href: '/branches', icon: Store },
    { label: 'Hardware Settings', href: '/settings/hardware', icon: Settings },
    { label: 'Tax Settings', href: '/settings', icon: Settings },
  ].filter(item => {
    // 1. SaaS Feature Flag Check (Must have feature if defined)
    if (item.requiredFeature && !hasFeature(item.requiredFeature)) {
      return false;
    }

    // 2. Role-based Access Check
    // Inventory Managers shouldn't see these items
    if (['Overview', 'Employees', 'Hardware Settings', 'Tax Settings', 'Reports', 'Branches'].includes(item.label)) {
      return user?.roles?.includes('ADMIN') || user?.roles?.includes('MANAGER');
    }
    
    // Suppliers and POs and Transfers are visible to ADMIN, MANAGER, and INVENTORY_MANAGER
    if (['Suppliers', 'Purchase Orders', 'Stock Transfers'].includes(item.label)) {
        return user?.roles?.includes('ADMIN') || user?.roles?.includes('MANAGER') || user?.roles?.includes('INVENTORY_MANAGER');
    }
    
    // Customers tab is visible to ADMIN, MANAGER, and CASHIER
    if (item.label === 'Customers') {
      return user?.roles?.includes('ADMIN') || user?.roles?.includes('MANAGER') || user?.roles?.includes('CASHIER');
    }
    return true; // Everyone else (including INVENTORY_MANAGER) sees the rest
  });

  return (
    <AuthGuard>
      <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-950 border-r border-gray-900 flex flex-col sticky top-0 h-screen">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-900">
          <Link href="/overview" className="text-xl font-bold tracking-tight">
            Lumora<span className="text-primary">POS</span>
          </Link>
          {user?.planTier && (
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-400 uppercase tracking-widest border border-gray-700">
              {user.planTier.replace('_BUSINESS', '')}
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group",
                  isActive 
                    ? "bg-primary/10 text-primary font-semibold" 
                    : "text-gray-400 hover:text-white hover:bg-gray-900"
                )}
              >
                <item.icon size={20} className={cn(
                  "transition-colors",
                  isActive ? "text-primary" : "text-gray-500 group-hover:text-white"
                )} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* POS Terminal Link & Profile */}
        <div className="p-4 border-t border-gray-900 space-y-4">
          {!user?.roles?.includes('ADMIN') && hasFeature('TIME_CLOCK') && <TimeClockWidget />}

          {/* POS Terminal Link - Only for specific roles */}
          {(user?.roles?.includes('ADMIN') || user?.roles?.includes('MANAGER') || user?.roles?.includes('CASHIER')) && (
            <Link
              href="/terminal"
              className="flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
            >
              <Monitor size={18} /> Open POS Terminal
            </Link>
          )}

          {/* User Profile Footer */}
          <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-xl border border-gray-800">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0 shadow-inner">
              {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || ''}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-gray-200 truncate pr-2">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-primary font-medium truncate">
                {user?.roles?.[0]?.replace('_', ' ') || 'EMPLOYEE'}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"
              title="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#050505]">
        {children}
      </main>
      </div>
    </AuthGuard>
  );
}

