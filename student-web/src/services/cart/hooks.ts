'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth-store';
import { addCartItem, clearCart, fetchCart, removeCartItem, updateCartItem } from './index';

export function useCart() {
  const isCustomer = useAuthStore((s) => s.user?.role === 'CUSTOMER' && !!s.token);
  return useQuery({ queryKey: qk.cart, queryFn: fetchCart, enabled: isCustomer });
}

function useCartMutation<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: qk.cart }) });
}

export const useAddToCart = () => useCartMutation(addCartItem);
export const useUpdateCartItem = () => useCartMutation((v: { id: string; quantity: number }) => updateCartItem(v.id, v.quantity));
export const useRemoveCartItem = () => useCartMutation(removeCartItem);
export const useClearCart = () => useCartMutation(clearCart);
