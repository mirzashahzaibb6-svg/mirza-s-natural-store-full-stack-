import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CancelActor } from '../../database/prisma';
import { PaymentSettlementService } from '../payments/payment-settlement.service';
import { OrderCancelService } from './order-cancel.service';
import { OrdersDbService } from './orders.db.service';

/** One interval for both jobs: every minute (notes/decisions.md D-06). In-process only, no Redis/Bull. */
@Injectable()
export class OrdersCron {
  private readonly logger = new Logger(OrdersCron.name);
  private running = false;

  constructor(
    private readonly ordersDb: OrdersDbService,
    private readonly cancelService: OrderCancelService,
    private readonly settlement: PaymentSettlementService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async run(): Promise<void> {
    if (this.running) return; // never overlap with a slow previous run
    this.running = true;
    try {
      await this.sweepExpiredOrders();
      const refunded = await this.settlement.retryPendingRefunds();
      if (refunded > 0) this.logger.log(`refund retry completed: ${refunded}`);
    } catch (error) {
      this.logger.error('scheduled job failed', error instanceof Error ? error.stack : undefined);
    } finally {
      this.running = false;
    }
  }

  async sweepExpiredOrders(): Promise<number> {
    const ids = await this.ordersDb.findExpiredPendingIds(new Date(), 50);
    let cancelled = 0;
    for (const orderId of ids) {
      const outcome = await this.cancelService.cancel({ orderId, actor: CancelActor.SYSTEM, reason: 'PAYMENT_TIMEOUT', onlyIfExpired: true });
      if (outcome === 'DONE') cancelled += 1;
    }
    if (cancelled > 0) this.logger.log(`timed out ${cancelled} unpaid order(s)`);
    return cancelled;
  }
}
