import { StockStatus } from '../../database/prisma';

/** available <= 0 => OUT_OF_STOCK; <= threshold => LOW_STOCK; otherwise IN_STOCK. */
export function computeStockStatus(qtyOnHand: number, lowStockThreshold: number): StockStatus {
  if (qtyOnHand <= 0) return StockStatus.OUT_OF_STOCK;
  if (qtyOnHand <= lowStockThreshold) return StockStatus.LOW_STOCK;
  return StockStatus.IN_STOCK;
}
