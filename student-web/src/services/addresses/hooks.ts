'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth-store';
import { createAddress, deleteAddress, fetchAddresses, setDefaultAddress, updateAddress } from './index';
import type { AddressInput } from './types';

export function useAddresses() {
  const isCustomer = useAuthStore((s) => s.user?.role === 'CUSTOMER' && !!s.token);
  return useQuery({ queryKey: qk.addresses, queryFn: fetchAddresses, enabled: isCustomer });
}

function useAddressMutation<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: qk.addresses }) });
}

export const useCreateAddress = () => useAddressMutation((v: AddressInput) => createAddress(v));
export const useUpdateAddress = () => useAddressMutation((v: { id: string; data: Omit<AddressInput, 'isDefault'> }) => updateAddress(v.id, v.data));
export const useDeleteAddress = () => useAddressMutation((id: string) => deleteAddress(id));
export const useSetDefaultAddress = () => useAddressMutation((id: string) => setDefaultAddress(id));
