import { qs } from '@/lib/utils';
import { request } from '@/lib/networking/request';
import type { OrderStatus, Paginated } from '../types';
import type { CreateOrderInput, MockCompleteResult, Order, Payment } from './types';

export const createOrder = (body: CreateOrderInput, idempotencyKey: string) =>
  request<Order>('/orders', { method: 'POST', body, headers: { 'Idempotency-Key': idempotencyKey } });
export const fetchMyOrders = (params: { page?: number; limit?: number; status?: OrderStatus }) => request<Paginated<Order>>(`/orders/me${qs(params)}`);
export const fetchMyOrder = (id: string) => request<Order>(`/orders/me/${id}`);
export const cancelMyOrder = (id: string, body: { reason: string; note?: string }) =>
  request<Order>(`/orders/me/${id}/cancel`, { method: 'PATCH', body });
export const initiatePayment = (orderId: string) => request<Payment>('/payments/initiate', { method: 'POST', body: { orderId } });
export const mockCompletePayment = (paymentId: string, outcome: 'SUCCESS' | 'FAILURE') =>
  request<MockCompleteResult>(`/payments/${paymentId}/mock-complete`, { method: 'POST', body: { outcome } });
