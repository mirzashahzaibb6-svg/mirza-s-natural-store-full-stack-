'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import type { OrderStatus } from '../types';
import { cancelMyOrder, createOrder, fetchMyOrder, fetchMyOrders, initiatePayment, mockCompletePayment } from './index';
import type { CreateOrderInput } from './types';

export const useMyOrders = (params: { page?: number; limit?: number; status?: OrderStatus }) =>
  useQuery({ queryKey: qk.orders(params), queryFn: () => fetchMyOrders(params), placeholderData: keepPreviousData });

export const useMyOrder = (id: string) => useQuery({ queryKey: qk.order(id), queryFn: () => fetchMyOrder(id) });

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { input: CreateOrderInput; key: string }) => createOrder(v.input, v.key),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.cart });
      void qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useCancelMyOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; reason: string; note?: string }) => cancelMyOrder(v.id, { reason: v.reason, note: v.note }),
    onSuccess: (order) => {
      qc.setQueryData(qk.order(order.id), order);
      void qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export const useInitiatePayment = () => useMutation({ mutationFn: initiatePayment });

export function useMockComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { paymentId: string; outcome: 'SUCCESS' | 'FAILURE' }) => mockCompletePayment(v.paymentId, v.outcome),
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: qk.order(r.order.id) });
      void qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
