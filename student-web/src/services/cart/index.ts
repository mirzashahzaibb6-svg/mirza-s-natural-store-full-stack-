import { request } from '@/lib/networking/request';
import type { Cart } from './types';

export const fetchCart = () => request<Cart>('/cart');
export const addCartItem = (body: { productId: string; quantity: number }) => request<Cart>('/cart/items', { method: 'POST', body });
export const updateCartItem = (id: string, quantity: number) => request<Cart>(`/cart/items/${id}`, { method: 'PATCH', body: { quantity } });
export const removeCartItem = (id: string) => request<void>(`/cart/items/${id}`, { method: 'DELETE' });
export const clearCart = () => request<void>('/cart', { method: 'DELETE' });
