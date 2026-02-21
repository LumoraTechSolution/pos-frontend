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
  Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/overview', icon: LayoutDashboard },
    { label: 'Products', href: '/inventory/products', icon: Package },
    { label: 'Categories', href: '/inventory/categories', icon: Tags },
    { label: 'Brands', href: '/inventory/brands', icon: Bookmark },
    { label: 'Customers', href: '/customers', icon: Users },
    { label: 'Employees', href: '/employees', icon: UserSquare2 },
    { label: 'Reports', href: '/reports', icon: BarChart3 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-950 border-r border-gray-900 flex flex-col sticky top-0 h-screen">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-900">
          <Link href="/overview" className="text-xl font-bold tracking-tight">
            Lumora<span className="text-indigo-500">POS</span>
          </Link>
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
                    ? "bg-indigo-600/10 text-indigo-400 font-semibold" 
                    : "text-gray-400 hover:text-white hover:bg-gray-900"
                )}
              >
                <item.icon size={20} className={cn(
                  "transition-colors",
                  isActive ? "text-indigo-400" : "text-gray-500 group-hover:text-white"
                )} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* POS Terminal Link */}
        <div className="p-4 border-t border-gray-900">
          <Link
            href="/terminal"
            className="flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
          >
            <Monitor size={18} /> Open POS Terminal
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#050505]">
        {children}
      </main>
    </div>
  );
}

