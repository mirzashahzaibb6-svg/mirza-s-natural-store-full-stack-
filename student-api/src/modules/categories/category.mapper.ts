import type { Category } from '../../database/prisma';
import type { CategoryResponse } from './types';

export const toCategoryResponse = (c: Category): CategoryResponse => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  parentId: c.parentId,
  depth: c.depth,
  path: c.path,
  isActive: c.isActive,
  createdAt: c.createdAt.toISOString(),
  updatedAt: c.updatedAt.toISOString(),
});
