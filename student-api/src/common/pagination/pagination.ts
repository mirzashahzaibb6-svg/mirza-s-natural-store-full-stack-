import type { PageMeta, Paginated } from '../types';

export function buildMeta(total: number, page: number, limit: number): PageMeta {
  const pages = Math.ceil(total / limit);
  return { total, currentPage: page, limit, pages, hasNextPage: page < pages, hasPrevPage: page > 1 };
}

export const toSkip = (page: number, limit: number): number => (page - 1) * limit;

export function paginated<T>(data: T[], total: number, page: number, limit: number): Paginated<T> {
  return { data, meta: buildMeta(total, page, limit) };
}
