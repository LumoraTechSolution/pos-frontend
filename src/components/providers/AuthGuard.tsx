'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token, logout } = useAuthStore();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Wait for Zustand to hydrate from localStorage before acting
    const unsubHydrate = useAuthStore.persist.onFinishHydration(() => {
      checkAuth();
    });

    let isMounted = true;

    const checkAuth = async () => {
      // 1. If Zustand says not authenticated, get out fast
      if (!useAuthStore.getState().isAuthenticated || !useAuthStore.getState().token) {
        if (isMounted) {
          useAuthStore.getState().logout();
          router.replace('/login');
        }
        return;
      }

      // 2. Perform a fast backend check to verify token is actually valid
      try {
        await authService.getMe();
        if (isMounted) setIsVerifying(false);
      } catch (error) {
        if (isMounted) {
          useAuthStore.getState().logout();
          router.replace('/login');
        }
      }
    };

    if (useAuthStore.persist.hasHydrated()) {
      checkAuth();
    }

    return () => {
      isMounted = false;
      unsubHydrate();
    };
  }, [router]);

  if (isVerifying) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black gap-4">
        <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-primary animate-spin"></div>
        <p className="text-gray-400 text-sm font-medium animate-pulse">Verifying session...</p>
      </div>
    );
  }

  return <>{children}</>;
}
