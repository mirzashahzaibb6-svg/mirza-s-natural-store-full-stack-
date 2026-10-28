import type { StockStatus } from '../../database/prisma';

export interface CartItemResponse {
  id: string;
  productId: string;
  name: string;
  sku: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
  minimumOrderQuantity: number;
  maxAllowedQuantity: number;
  isAvailable: boolean;
  stockStatus: StockStatus;
}

export interface CartResponse {
  id: string;
  items: CartItemResponse[];
  subtotal: string;
  shippingCost: string;
  grandTotal: string;
}
