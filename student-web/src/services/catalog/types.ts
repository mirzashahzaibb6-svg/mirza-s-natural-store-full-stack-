import type { StockStatus } from '../types';

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  depth: number;
  path: string;
  isActive: boolean;
}
export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  categoryId: string;
  category: { id: string; name: string; slug: string };
  price: string;
  minimumOrderQuantity: number;
  maximumOrderQuantity: number;
  isActive: boolean;
  stockStatus: StockStatus;
}
export interface ProductFilters {
  page?: number;
  limit?: number;
  q?: string;
  categoryId?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc';
}
