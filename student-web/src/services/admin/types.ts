import type { StockStatus } from '../types';

export interface InventoryRow {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  qtyOnHand: number;
  lowStockThreshold: number;
  status: StockStatus;
  updatedAt: string;
}
export interface InventoryTx {
  id: string;
  type: string;
  quantity: number;
  quantityAfter: number;
  reason: string | null;
  note: string | null;
  orderId: string | null;
  createdAt: string;
}
export const ADJUSTMENT_REASONS = ['RECEIVED_STOCK', 'FOUND_STOCK', 'COUNT_CORRECTION', 'DAMAGE', 'RETURN_TO_SUPPLIER', 'OTHER'] as const;
export const ADMIN_CANCEL_REASONS = ['CUSTOMER_REQUEST', 'OUT_OF_STOCK', 'PAYMENT_ISSUE', 'OTHER'] as const;
