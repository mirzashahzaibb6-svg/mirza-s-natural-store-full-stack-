import { Inject, Injectable, Logger } from '@nestjs/common';
import { PAYMENT_GATEWAY, type PaymentGateway } from '../../infrastructure/payment/payment-gateway';
import { PaymentStatus } from '../../database/prisma';
import { MoneyService } from '../../shared/money/money.service';
import { PaymentsDbService } from './payments.db.service';

/** Gateway side effects that must happen AFTER a database transaction has committed. */
@Injectable()
export class PaymentSettlementService {
  private readonly logger = new Logger(PaymentSettlementService.name);

  constructor(
    private readonly paymentsDb: PaymentsDbService,
    private readonly money: MoneyService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
  ) {}

  async cancelGatewayPayment(paymentId: string): Promise<void> {
    const payment = await this.paymentsDb.findById(paymentId);
    if (!payment) return;
    try {
      await this.gateway.cancel(payment.gatewayRef);
    } catch (error) {
      this.logger.warn(`gateway cancel failed payment=${paymentId}: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }

  /** Returns true when the refund completed. On gateway failure the payment stays REFUND_PENDING (retried by cron). */
  async refund(paymentId: string): Promise<boolean> {
    const payment = await this.paymentsDb.findById(paymentId);
    if (!payment || payment.status !== PaymentStatus.REFUND_PENDING) return false;
    try {
      await this.gateway.refund(payment.gatewayRef, this.money.format(payment.amount));
    } catch (error) {
      this.logger.warn(`refund failed payment=${paymentId}, will retry: ${error instanceof Error ? error.message : 'unknown'}`);
      return false;
    }
    return this.paymentsDb.completeRefund(paymentId);
  }

  async retryPendingRefunds(): Promise<number> {
    const pending = await this.paymentsDb.listRefundPending(50);
    let done = 0;
    for (const { id } of pending) {
      if (await this.refund(id)) done += 1;
    }
    return done;
  }
}
