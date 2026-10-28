import type { Inventory, InventoryTransaction, Product } from '../../database/prisma';
import type { InventoryResponse, InventoryTransactionResponse } from './types';

export const toInventoryResponse = (i: Inventory & { product: Pick<Product, 'name' | 'sku'> }): InventoryResponse => ({
  id: i.id,
  productId: i.productId,
  productName: i.product.name,
  sku: i.product.sku,
  qtyOnHand: i.qtyOnHand,
  lowStockThreshold: i.lowStockThreshold,
  status: i.status,
  updatedAt: i.updatedAt.toISOString(),
});

export const toTransactionResponse = (t: InventoryTransaction): InventoryTransactionResponse => ({
  id: t.id,
  type: t.type,
  quantity: t.quantity,
  quantityAfter: t.quantityAfter,
  reason: t.reason,
  note: t.note,
  orderId: t.orderId,
  createdAt: t.createdAt.toISOString(),
});
