'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { fetchCategories, fetchProducts } from './index';
import type { ProductFilters } from './types';

export const useCategories = (params: { page?: number; limit?: number; q?: string } = { limit: 100 }) =>
  useQuery({ queryKey: qk.categories(params), queryFn: () => fetchCategories(params), staleTime: 60_000 });

export const useProducts = (filters: ProductFilters) =>
  useQuery({ queryKey: qk.products(filters), queryFn: () => fetchProducts(filters), placeholderData: keepPreviousData });
