import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { PaymentEvent } from '../../infrastructure/payment/payment-gateway';
import { PaymentSettlementService } from './payment-settlement.service';
import { PaymentsDbService } from './payments.db.service';

/** ONE code path for payment results: used by the webhook AND by mock-complete (notes/decisions.md D-15). */
@Injectable()
export class PaymentEventsService {
  private readonly logger = new Logger(PaymentEventsService.name);

  constructor(private readonly paymentsDb: PaymentsDbService, private readonly settlement: PaymentSettlementService) {}

  async handle(event: PaymentEvent): Promise<{ result: string }> {
    const payment = await this.paymentsDb.findByGatewayRef(event.gatewayRef);
    if (!payment) throw new NotFoundException('Unknown payment reference');

    if (event.type === 'payment.succeeded') {
      const outcome = await this.paymentsDb.applySuccess(payment.id);
      if (outcome === 'LATE') {
        this.logger.warn(`late payment for order=${payment.orderId}; refunding`);
        await this.settlement.refund(payment.id);
      }
      return { result: outcome };
    }
    const changed = await this.paymentsDb.applyFailure(payment.id);
    return { result: changed ? 'FAILED' : 'IGNORED' };
  }
}
