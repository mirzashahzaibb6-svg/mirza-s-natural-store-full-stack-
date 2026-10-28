import type { Category, Inventory, Product } from '../../database/prisma';
import { StockStatus } from '../../database/prisma';
import { formatMoney } from '../../shared/money/format';
import type { ProductResponse } from './types';

export type ProductWithRelations = Product & {
  category: Pick<Category, 'id' | 'name' | 'slug'>;
  inventory: Pick<Inventory, 'status'> | null;
};

export const toProductResponse = (p: ProductWithRelations): ProductResponse => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  sku: p.sku,
  description: p.description,
  categoryId: p.categoryId,
  category: { id: p.category.id, name: p.category.name, slug: p.category.slug },
  price: formatMoney(p.price),
  minimumOrderQuantity: p.minimumOrderQuantity,
  maximumOrderQuantity: p.maximumOrderQuantity,
  isActive: p.isActive,
  stockStatus: p.inventory?.status ?? StockStatus.OUT_OF_STOCK,
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
});
