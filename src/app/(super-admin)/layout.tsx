'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSuperAdminStore } from '@/stores/superAdminStore';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useSuperAdminStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const isLoginPage = pathname === '/super-admin/login';
      const isChangePasswordPage = pathname === '/super-admin/change-password';
      const state = useSuperAdminStore.getState();
      const authenticated = state.isAuthenticated;
      const mustChangePassword = state.user?.passwordChangeRequired === true;

      if (!authenticated && !isLoginPage) {
        router.push('/super-admin/login');
      } else if (authenticated && mustChangePassword && !isChangePasswordPage) {
        router.push('/super-admin/change-password');
      } else if (authenticated && !mustChangePassword && isLoginPage) {
        router.push('/super-admin');
      }
      setMounted(true);
    };

    if (useSuperAdminStore.persist.hasHydrated()) {
      checkAuth();
    } else {
      useSuperAdminStore.persist.onFinishHydration(() => {
        checkAuth();
      });
    }
  }, [pathname, router]);

  if (!mounted) return null; // Prevent hydration errors

  const isLoginPage = pathname === '/super-admin/login';
  const isChangePasswordPage = pathname === '/super-admin/change-password';

  if (isLoginPage || isChangePasswordPage) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-blue-500" />
          <h1 className="text-xl font-bold tracking-tight">Lumora HQ</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link 
            href="/super-admin" 
            className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
              pathname === '/super-admin' 
                ? 'bg-gray-800 text-white' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            Dashboard
          </Link>
          <Link 
            href="/super-admin/tenants" 
            className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
              pathname.startsWith('/super-admin/tenants') 
                ? 'bg-gray-800 text-white' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            Tenants
          </Link>
          <Link 
            href="/super-admin/audit-log" 
            className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
              pathname.startsWith('/super-admin/audit-log') 
                ? 'bg-gray-800 text-white' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            Audit Logs
          </Link>
          <button
            onClick={async () => {
              const refreshToken = useSuperAdminStore.getState().refreshToken;
              await fetch('/api/super-admin-logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(refreshToken ? { refreshToken } : {}),
              }).catch(() => {});
              logout();
              router.push('/super-admin/login');
            }}
            className="w-full text-left mt-auto px-4 py-3 rounded-lg text-red-400 font-medium hover:bg-gray-800 hover:text-red-300 transition-colors"
          >
            Sign Out
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center px-8 shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">Super Admin Portal</h2>
        </header>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
