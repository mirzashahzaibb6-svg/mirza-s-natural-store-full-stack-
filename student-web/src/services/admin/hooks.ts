'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import type { OrderStatus } from '../types';
import * as api from './index';

type Q = Record<string, string | number | boolean | undefined>;

export const useAdminCustomers = (p: Q) => useQuery({ queryKey: qk.admin.customers(p), queryFn: () => api.adminCustomers(p), placeholderData: keepPreviousData });
export const useAdminCategories = (p: Q) => useQuery({ queryKey: qk.admin.categories(p), queryFn: () => api.adminCategories(p), placeholderData: keepPreviousData });
export const useAdminProducts = (p: Q) => useQuery({ queryKey: qk.admin.products(p), queryFn: () => api.adminProducts(p), placeholderData: keepPreviousData });
export const useAdminInventory = (p: Q) => useQuery({ queryKey: qk.admin.inventory(p), queryFn: () => api.adminInventory(p), placeholderData: keepPreviousData });
export const useAdminInventoryTx = (id: string | null, p: Q) =>
  useQuery({ queryKey: qk.admin.transactions(id ?? '', p), queryFn: () => api.adminInventoryTx(id as string, p), enabled: !!id });
export const useAdminOrders = (p: Q) => useQuery({ queryKey: qk.admin.orders(p), queryFn: () => api.adminOrders(p), placeholderData: keepPreviousData });
export const useAdminOrder = (id: string) => useQuery({ queryKey: qk.admin.order(id), queryFn: () => api.adminOrder(id) });

/** Any admin mutation refreshes everything under the "admin" prefix (small app, simple and safe). */
function useAdminMutation<V, R>(fn: (v: V) => Promise<R>, extraKeys: string[][] = []) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
      for (const key of extraKeys) void qc.invalidateQueries({ queryKey: key });
    },
  });
}

export const useSetCustomerStatus = () => useAdminMutation((v: { id: string; isActive: boolean }) => api.adminSetCustomerStatus(v.id, v.isActive));
export const useCreateCategory = () => useAdminMutation(api.adminCreateCategory, [['categories']]);
export const useUpdateCategory = () => useAdminMutation((v: { id: string; data: Parameters<typeof api.adminUpdateCategory>[1] }) => api.adminUpdateCategory(v.id, v.data), [['categories']]);
export const useDeleteCategory = () => useAdminMutation(api.adminDeleteCategory, [['categories']]);
export const useCreateProduct = () => useAdminMutation(api.adminCreateProduct, [['products']]);
export const useUpdateProduct = () => useAdminMutation((v: { id: string; data: Partial<api.ProductInput> }) => api.adminUpdateProduct(v.id, v.data), [['products']]);
export const useCreateInventory = () => useAdminMutation(api.adminCreateInventory, [['products']]);
export const useAdjustInventory = () => useAdminMutation(api.adminAdjustInventory, [['products']]);
export const useSetOrderStatus = () => useAdminMutation((v: { id: string; status: OrderStatus }) => api.adminSetOrderStatus(v.id, v.status));
export const useAdminCancelOrder = () => useAdminMutation((v: { id: string; reason: string; note?: string }) => api.adminCancelOrder(v.id, { reason: v.reason, note: v.note }));
