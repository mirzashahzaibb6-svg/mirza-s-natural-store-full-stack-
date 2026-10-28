import type { StockStatus } from '../../database/prisma';

export interface ProductResponse {
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
  createdAt: string;
  updatedAt: string;
}
