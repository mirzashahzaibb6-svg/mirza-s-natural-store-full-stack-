import type { DeliveryType, OrderStatus, PaymentStatus } from '../types';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}
export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryType: DeliveryType;
  items: OrderItem[];
  address: { addressLine: string; city: string; county: string; postcode: string } | null;
  subtotal: string;
  shippingCost: string;
  total: string;
  customerNotes: string | null;
  pickupScheduledAt: string | null;
  paymentExpiresAt: string;
  payment: { id: string; status: PaymentStatus; amount: string } | null;
  cancelReason: string | null;
  cancelNote: string | null;
  confirmedAt: string | null;
  processedAt: string | null;
  readyAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  customer?: { id: string; name: string; email: string };
  nextStatuses?: OrderStatus[];
}
export interface CreateOrderInput {
  deliveryType: DeliveryType;
  addressId?: string;
  shippingAddress?: { addressLine: string; city: string; county: string; postcode: string };
  pickupScheduledAt?: string;
  customerNotes?: string;
}
export interface Payment {
  id: string;
  orderId: string;
  amount: string;
  status: PaymentStatus;
  gatewayRef: string;
  paidAt: string | null;
  orderExpiresAt: string;
}
export interface MockCompleteResult {
  payment: Payment;
  order: { id: string; status: OrderStatus; paymentStatus: PaymentStatus };
  result: string;
}
export const CUSTOMER_CANCEL_REASONS = ['CHANGED_MIND', 'ORDERED_BY_MISTAKE', 'FOUND_BETTER_PRICE', 'DELIVERY_TOO_LONG', 'OTHER'] as const;
export const CUSTOMER_CANCELLABLE: OrderStatus[] = ['PENDING', 'CONFIRMED'];
