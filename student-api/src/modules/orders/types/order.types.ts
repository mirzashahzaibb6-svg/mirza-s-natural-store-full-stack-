import type { CancelActor, DeliveryType, OrderStatus, PaymentStatus } from '../../../database/prisma';

export interface OrderItemResponse {
  productId: string;
  productName: string;
  sku: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryType: DeliveryType;
  items: OrderItemResponse[];
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
  cancelledBy: CancelActor | null;
  confirmedAt: string | null;
  processedAt: string | null;
  readyAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  customer?: { id: string; name: string; email: string };
  nextStatuses?: OrderStatus[];
}
