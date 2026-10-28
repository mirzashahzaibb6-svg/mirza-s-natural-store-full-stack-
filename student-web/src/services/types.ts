export interface PageMeta {
  total: number;
  currentPage: number;
  limit: number;
  pages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type OrderStatus =
  | 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY_FOR_PICKUP' | 'READY_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'REFUND_PENDING';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUND_PENDING' | 'REFUNDED';
export type DeliveryType = 'DELIVERY' | 'PICKUP';
