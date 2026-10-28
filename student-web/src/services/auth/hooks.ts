'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth-store';
import { fetchMe, loginUser, registerUser } from './index';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({ mutationFn: loginUser, onSuccess: (r) => setAuth(r.accessToken, r.user) });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({ mutationFn: registerUser, onSuccess: (r) => setAuth(r.accessToken, r.user) });
}

/** Re-validates the stored session against the API (a 401 clears it inside request()). */
export function useMe(enabled: boolean) {
  return useQuery({ queryKey: qk.me, queryFn: fetchMe, enabled, staleTime: 60_000 });
}
