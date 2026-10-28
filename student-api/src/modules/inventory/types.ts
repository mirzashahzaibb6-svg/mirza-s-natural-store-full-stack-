import type { InventoryMovementType, StockStatus } from '../../database/prisma';

export interface InventoryResponse {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  qtyOnHand: number;
  lowStockThreshold: number;
  status: StockStatus;
  updatedAt: string;
}

export interface InventoryTransactionResponse {
  id: string;
  type: InventoryMovementType;
  quantity: number;
  quantityAfter: number;
  reason: string | null;
  note: string | null;
  orderId: string | null;
  createdAt: string;
}
