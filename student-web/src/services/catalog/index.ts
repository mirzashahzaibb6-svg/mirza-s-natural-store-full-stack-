import { qs } from '@/lib/utils';
import { request } from '@/lib/networking/request';
import type { Paginated } from '../types';
import type { Category, Product, ProductFilters } from './types';

export const fetchCategories = (params: { page?: number; limit?: number; q?: string } = {}) =>
  request<Paginated<Category>>(`/categories${qs(params)}`, { auth: false });
export const fetchProducts = (filters: ProductFilters) =>
  request<Paginated<Product>>(`/products${qs({ ...filters })}`, { auth: false });
