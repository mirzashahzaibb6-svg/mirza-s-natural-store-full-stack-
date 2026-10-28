import type { OrderStatus, PaymentStatus } from '../../database/prisma';

export interface PaymentResponse {
  id: string;
  orderId: string;
  amount: string;
  status: PaymentStatus;
  gatewayRef: string;
  paidAt: string | null;
  orderExpiresAt: string;
}

export interface MockCompleteResponse {
  payment: PaymentResponse;
  order: { id: string; status: OrderStatus; paymentStatus: PaymentStatus };
  result: string;
}
