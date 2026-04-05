import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SuperAdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
}

interface SuperAdminAuthState {
  user: SuperAdminUser | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: SuperAdminUser, token: string) => void;
  logout: () => void;
}

export const useSuperAdminStore = create<SuperAdminAuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user: SuperAdminUser, token: string) => {
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'lumora-super-admin-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
