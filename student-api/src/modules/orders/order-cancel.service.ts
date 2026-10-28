import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CancelActor, InventoryMovementType, OrderStatus, PaymentStatus } from '../../database/prisma';
import { InventoryDbService } from '../inventory/inventory.db.service';
import { PaymentSettlementService } from '../payments/payment-settlement.service';
import { OrdersDbService } from './orders.db.service';
import { ADMIN_CANCELLABLE, CUSTOMER_CANCELLABLE, SYSTEM_CANCELLABLE } from './types/order-transitions';

export interface CancelInput {
  orderId: string;
  actor: CancelActor;
  userId?: string; // set for customers => ownership scoping
  reason: string;
  note?: string;
  onlyIfExpired?: boolean; // SYSTEM timeout sweep
}
export type CancelOutcome = 'DONE' | 'ALREADY' | 'SKIPPED';

/** The ONE cancellation implementation shared by customer, admin and the timeout cron. */
@Injectable()
export class OrderCancelService {
  private readonly logger = new Logger(OrderCancelService.name);

  constructor(
    private readonly ordersDb: OrdersDbService,
    private readonly inventoryDb: InventoryDbService,
    private readonly settlement: PaymentSettlementService,
  ) {}

  async cancel(input: CancelInput): Promise<CancelOutcome> {
    const result = await this.ordersDb.transaction(async (tx) => {
      const order = await this.ordersDb.findForCancel(tx, input.orderId, input.userId);
      if (!order) {
        if (input.actor === CancelActor.SYSTEM) return { outcome: 'SKIPPED' as CancelOutcome };
        throw new NotFoundException('Order not found');
      }
      // Repeated cancel => consistent success, no second stock restore / refund.
      if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUND_PENDING) return { outcome: 'ALREADY' as CancelOutcome };

      const allowed = input.actor === CancelActor.CUSTOMER ? CUSTOMER_CANCELLABLE : input.actor === CancelActor.ADMIN ? ADMIN_CANCELLABLE : SYSTEM_CANCELLABLE;
      if (!allowed.includes(order.status)) {
        if (input.actor === CancelActor.SYSTEM) return { outcome: 'SKIPPED' as CancelOutcome };
        throw new BadRequestException(`An order in status ${order.status} cannot be cancelled`);
      }

      const paid = order.paymentStatus === PaymentStatus.PAID;
      const now = new Date();
      const changed = await this.ordersDb.guardedCancel(
        tx, order.id, order.status,
        { status: paid ? OrderStatus.REFUND_PENDING : OrderStatus.CANCELLED, cancelReason: input.reason, cancelNote: input.note ?? null, cancelledBy: input.actor, cancelledAt: now },
        input.onlyIfExpired ? now : undefined,
      );
      if (changed === 0) {
        const current = await this.ordersDb.currentStatus(tx, order.id);
        if (current === OrderStatus.CANCELLED || current === OrderStatus.REFUND_PENDING) return { outcome: 'ALREADY' as CancelOutcome };
        if (input.onlyIfExpired) return { outcome: 'SKIPPED' as CancelOutcome };
        throw new ConflictException('The order changed while cancelling. Please refresh and try again.');
      }

      // Restore stock exactly once (the guarded update above guarantees a single winner).
      for (const row of await this.ordersDb.consumedMovements(tx, order.id)) {
        const locked = await this.inventoryDb.lockById(tx, row.inventoryId);
        if (locked) {
          await this.inventoryDb.applyMovement(tx, locked, Math.abs(row.quantity), InventoryMovementType.RELEASED, { orderId: order.id, reason: 'ORDER_CANCELLED' });
        }
      }
      if (order.payment) {
        if (paid) await this.ordersDb.setPaymentRefundPending(tx, order.id);
        else await this.ordersDb.cancelOpenPayment(tx, order.id);
      }
      return { outcome: 'DONE' as CancelOutcome, paymentId: order.payment?.id, paid };
    });

    // Network calls happen only AFTER the transaction committed.
    if (result.outcome === 'DONE' && 'paymentId' in result && result.paymentId) {
      if (result.paid) await this.settlement.refund(result.paymentId);
      else await this.settlement.cancelGatewayPayment(result.paymentId);
    }
    if (result.outcome === 'DONE') this.logger.log(`order=${input.orderId} cancelled by ${input.actor} (${input.reason})`);
    return result.outcome;
  }
}
