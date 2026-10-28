import { request } from '@/lib/networking/request';
import type { Address, AddressInput } from './types';

export const fetchAddresses = () => request<Address[]>('/addresses');
export const createAddress = (body: AddressInput) => request<Address>('/addresses', { method: 'POST', body });
export const updateAddress = (id: string, body: Omit<AddressInput, 'isDefault'>) => request<Address>(`/addresses/${id}`, { method: 'PATCH', body });
export const deleteAddress = (id: string) => request<void>(`/addresses/${id}`, { method: 'DELETE' });
export const setDefaultAddress = (id: string) => request<Address>(`/addresses/${id}/default`, { method: 'PATCH' });
