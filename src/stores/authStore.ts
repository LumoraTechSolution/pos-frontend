import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types/auth';
import { bindSentryUser, clearSentryUser } from '@/lib/sentry';

export type { User };

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasFeature: (feature: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user: User, token: string, refreshToken: string) => {
        set({ user, token, refreshToken, isAuthenticated: true });
        bindSentryUser(user);
      },

      logout: () => {
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
        clearSentryUser();
      },

      hasPermission: (permission: string) => {
        const state = get();
        return state.user?.permissions?.includes(permission) ?? false;
      },

      hasRole: (role: string) => {
        const state = get();
        return state.user?.roles?.includes(role) ?? false;
      },

      hasFeature: (feature: string) => {
        const state = get();
        return state.user?.featuresEnabled?.includes(feature) ?? false;
      },
    }),
    {
      name: 'lumora-pos-auth',
      // sessionStorage: survives page reload within the same tab,
      // but clears automatically when the browser session ends.
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : localStorage
      ),
      partialize: (state) => ({
        user: state.user,
        // token is intentionally omitted — access tokens are memory-only to reduce XSS exposure.
        // refreshToken is kept so the silent-refresh flow works across page reloads within the
        // same browser session (sessionStorage is cleared when the tab/window is closed).
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
