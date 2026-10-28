import { qs } from '@/lib/utils';
import { request } from '@/lib/networking/request';
import type { UserDto } from '../auth/types';
import type { Category, Product } from '../catalog/types';
import type { Order } from '../orders/types';
import type { OrderStatus, Paginated, PaymentStatus, StockStatus } from '../types';
import type { InventoryRow, InventoryTx } from './types';

type Q = Record<string, string | number | boolean | undefined>;

export const adminCustomers = (p: Q) => request<Paginated<UserDto>>(`/admin/customers${qs(p)}`);
export const adminSetCustomerStatus = (id: string, isActive: boolean) => request<UserDto>(`/admin/customers/${id}/status`, { method: 'PATCH', body: { isActive } });

export const adminCategories = (p: Q) => request<Paginated<Category>>(`/admin/categories${qs(p)}`);
export const adminCreateCategory = (body: { name: string; parentId?: string; isActive?: boolean }) => request<Category>('/admin/categories', { method: 'POST', body });
export const adminUpdateCategory = (id: string, body: { name?: string; parentId?: string | null; isActive?: boolean }) => request<Category>(`/admin/categories/${id}`, { method: 'PATCH', body });
export const adminDeleteCategory = (id: string) => request<void>(`/admin/categories/${id}`, { method: 'DELETE' });

export interface ProductInput {
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  minimumOrderQuantity: number;
  maximumOrderQuantity: number;
  isActive: boolean;
}
export const adminProducts = (p: Q) => request<Paginated<Product>>(`/admin/products${qs(p)}`);
export const adminCreateProduct = (body: ProductInput) => request<Product>('/admin/products', { method: 'POST', body });
export const adminUpdateProduct = (id: string, body: Partial<ProductInput>) => request<Product>(`/admin/products/${id}`, { method: 'PATCH', body });

export const adminInventory = (p: Q & { stockStatus?: StockStatus }) => request<Paginated<InventoryRow>>(`/admin/inventory${qs(p)}`);
export const adminCreateInventory = (body: { productId: string; qtyOnHand: number; lowStockThreshold?: number }) => request<InventoryRow>('/admin/inventory', { method: 'POST', body });
export const adminAdjustInventory = (body: { inventoryId: string; quantity: number; reason: string; note?: string }) =>
  request<InventoryRow>('/admin/inventory/adjustments', { method: 'POST', body });
export const adminInventoryTx = (id: string, p: Q) => request<Paginated<InventoryTx>>(`/admin/inventory/${id}/transactions${qs(p)}`);

export const adminOrders = (p: Q & { status?: OrderStatus; paymentStatus?: PaymentStatus }) => request<Paginated<Order>>(`/admin/orders${qs(p)}`);
export const adminOrder = (id: string) => request<Order>(`/admin/orders/${id}`);
export const adminSetOrderStatus = (id: string, status: OrderStatus) => request<Order>(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status } });
export const adminCancelOrder = (id: string, body: { reason: string; note?: string }) => request<Order>(`/admin/orders/${id}/cancel`, { method: 'PATCH', body });
