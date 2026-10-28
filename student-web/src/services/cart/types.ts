import type { StockStatus } from '../types';

export interface CartItem {
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
export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: string;
  shippingCost: string;
  grandTotal: string;
}
