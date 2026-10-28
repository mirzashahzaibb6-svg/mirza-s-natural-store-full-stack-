import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { OrderStatus, PaymentStatus } from '../../database/prisma';
import { PAYMENT_GATEWAY, type PaymentEvent, type PaymentGateway } from '../../infrastructure/payment/payment-gateway';
import { MoneyService } from '../../shared/money/money.service';
import { InitiatePaymentDto, MockCompleteDto } from './dto/payment.dto';
import { PaymentEventsService } from './payment-events.service';
import { PaymentsDbService, type PaymentWithOrder } from './payments.db.service';
import type { MockCompleteResponse, PaymentResponse } from './types';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsDb: PaymentsDbService,
    private readonly events: PaymentEventsService,
    private readonly money: MoneyService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
  ) {}

  /** The amount ALWAYS comes from order.total on the server; one reusable payment per order. */
  async initiate(userId: string, dto: InitiatePaymentDto): Promise<PaymentResponse> {
    const order = await this.paymentsDb.findOrderOwned(dto.orderId, userId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING) throw new BadRequestException('Order is not awaiting payment');
    if (order.paymentExpiresAt.getTime() < Date.now()) throw new BadRequestException('The payment window for this order has expired');

    let payment: PaymentWithOrder | null = null;
    if (order.payment) {
      const existing = order.payment;
      if (existing.status === PaymentStatus.PAID) throw new BadRequestException('Order is already paid');
      if (existing.status === PaymentStatus.FAILED) await this.paymentsDb.resetFailed(existing.id);
      else if (existing.status !== PaymentStatus.UNPAID) throw new BadRequestException(`Payment cannot be restarted (status ${existing.status})`);
      payment = await this.paymentsDb.findById(existing.id);
    } else {
      const intent = await this.gateway.createIntent({ orderId: order.id, amount: this.money.format(order.total) });
      const created = await this.paymentsDb.createPayment({ orderId: order.id, amount: order.total, gatewayRef: intent.gatewayRef });
      // null => a parallel request created it first (unique orderId): reuse that one.
      payment = created ?? (await this.paymentsDb.findByOrderId(order.id));
    }
    if (!payment) throw new NotFoundException('Payment not found');
    return this.toResponse(payment);
  }

  /** Mock gateway "customer pressed pay": builds a signed event and feeds the SAME handler as the webhook. */
  async mockComplete(userId: string, paymentId: string, dto: MockCompleteDto): Promise<MockCompleteResponse> {
    const payment = await this.paymentsDb.findOwnedPayment(paymentId, userId);
    if (!payment) throw new NotFoundException('Payment not found');

    const event: PaymentEvent = {
      eventId: randomUUID(),
      type: dto.outcome === 'SUCCESS' ? 'payment.succeeded' : 'payment.failed',
      gatewayRef: payment.gatewayRef,
    };
    const raw = JSON.stringify(event);
    if (!this.gateway.verifyEvent(raw, this.gateway.signEvent(raw))) throw new BadRequestException('Invalid signature');
    const { result } = await this.events.handle(event);

    const fresh = await this.paymentsDb.findOwnedPayment(paymentId, userId);
    if (!fresh) throw new NotFoundException('Payment not found');
    return { payment: this.toResponse(fresh), order: { id: fresh.order.id, status: fresh.order.status, paymentStatus: fresh.order.paymentStatus }, result };
  }

  private toResponse(p: PaymentWithOrder): PaymentResponse {
    return {
      id: p.id,
      orderId: p.orderId,
      amount: this.money.format(p.amount),
      status: p.status,
      gatewayRef: p.gatewayRef,
      paidAt: p.paidAt ? p.paidAt.toISOString() : null,
      orderExpiresAt: p.order.paymentExpiresAt.toISOString(),
    };
  }
}
