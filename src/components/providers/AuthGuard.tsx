'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { performLogout } from '@/lib/performLogout';

// Module-level: persists across component mounts within the same browser tab session.
// Cleared whenever the user logs out via the store subscription below.
let verifiedAt: number | null = null;
const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isSessionRecentlyVerified(): boolean {
  return verifiedAt !== null && Date.now() - verifiedAt < SESSION_TTL_MS;
}

function isTokenExpired(token: string): boolean {
  try {
    // JWTs use base64url (- and _); atob() needs standard base64 (+ and /)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Clear the module-level verified timestamp whenever the store logs out.
    const unsubStore = useAuthStore.subscribe((state, prev) => {
      if (prev.isAuthenticated && !state.isAuthenticated) {
        verifiedAt = null;
      }
    });

    const checkAuth = async () => {
      const { isAuthenticated, token } = useAuthStore.getState();

      // token is memory-only since P1 1.6 — it is always null after a page reload.
      // Only bail out here if we have no session at all; the getMe() call below
      // will trigger the 401 → silent-refresh flow when token is null but
      // refreshToken is still in sessionStorage.
      if (!isAuthenticated) {
        await performLogout();
        if (isMounted) router.replace('/login');
        return;
      }

      // Already verified recently in this tab — skip the backend round-trip.
      // This avoids burning through the login rate-limit bucket during normal
      // navigation (getMe was previously called on every route-group change).
      if (isSessionRecentlyVerified()) {
        if (isMounted) setIsVerifying(false);
        return;
      }

      // Token is locally valid — show the UI immediately and verify in background.
      if (token && !isTokenExpired(token) && isMounted) {
        setIsVerifying(false);
      }

      try {
        await authService.getMe();
        verifiedAt = Date.now();
        if (isMounted) setIsVerifying(false);
      } catch {
        // The api interceptor already called performLogout during the refresh failure.
        // Here we just need to make sure we navigate to /login — cookie is cleared,
        // so the middleware won't bounce us back to /overview.
        if (isMounted) router.replace('/login');
      }
    };

    // Guard against double-invocation (StrictMode, rapid re-mounts).
    let called = false;
    const runOnce = () => {
      if (called) return;
      called = true;
      checkAuth();
    };

    const unsub = useAuthStore.persist.onFinishHydration(() => {
      unsub();
      if (isMounted) runOnce();
    });

    // If already hydrated, don't wait for the event.
    if (useAuthStore.persist.hasHydrated()) {
      unsub();
      runOnce();
    }

    return () => {
      isMounted = false;
      unsubStore();
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
