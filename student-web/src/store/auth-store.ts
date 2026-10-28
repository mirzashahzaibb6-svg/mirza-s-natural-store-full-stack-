'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
  isActive: boolean;
}

interface AuthState {
  token: string | null;
  user: SessionUser | null;
  hydrated: boolean;
  setAuth: (token: string, user: SessionUser) => void;
  setUser: (user: SessionUser) => void;
  clear: () => void;
}

/** Token + user live in localStorage; hydration is manual so server and first client render match. */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hydrated: false,
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      clear: () => set({ token: null, user: null }),
    }),
    { name: 'mirzas-auth', partialize: (s) => ({ token: s.token, user: s.user }), skipHydration: true },
  ),
);
