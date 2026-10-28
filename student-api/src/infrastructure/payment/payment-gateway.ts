export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export interface PaymentIntent {
  gatewayRef: string;
}

export type PaymentEventType = 'payment.succeeded' | 'payment.failed';

export interface PaymentEvent {
  eventId: string;
  type: PaymentEventType;
  gatewayRef: string;
}

/** Real Stripe (or any gateway) can replace MockPaymentGateway without touching order logic. */
export interface PaymentGateway {
  createIntent(input: { orderId: string; amount: string }): Promise<PaymentIntent>;
  cancel(gatewayRef: string): Promise<void>;
  refund(gatewayRef: string, amount: string): Promise<void>;
  signEvent(rawBody: string): string;
  verifyEvent(rawBody: string | Buffer, signature: string | undefined): boolean;
}
