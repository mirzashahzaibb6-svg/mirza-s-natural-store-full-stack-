import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { TX_OPTIONS } from '../../database/database.types';
import { isUniqueViolation } from '../../database/db-errors';
import { OrderStatus, PaymentStatus, Prisma, type Order, type Payment } from '../../database/prisma';

export type PaymentWithOrder = Payment & { order: Order };
export type SuccessOutcome = 'CONFIRMED' | 'DUPLICATE' | 'LATE';

@Injectable()
export class PaymentsDbService {
  constructor(private readonly db: DatabaseService) {}

  findOrderOwned(orderId: string, userId: string): Promise<(Order & { payment: Payment | null }) | null> {
    return this.db.order.findFirst({ where: { id: orderId, userId }, include: { payment: true } });
  }

  findOwnedPayment(paymentId: string, userId: string): Promise<PaymentWithOrder | null> {
    return this.db.payment.findFirst({ where: { id: paymentId, order: { userId } }, include: { order: true } });
  }

  findById(id: string): Promise<PaymentWithOrder | null> {
    return this.db.payment.findUnique({ where: { id }, include: { order: true } });
  }

  findByOrderId(orderId: string): Promise<PaymentWithOrder | null> {
    return this.db.payment.findUnique({ where: { orderId }, include: { order: true } });
  }

  findByGatewayRef(gatewayRef: string): Promise<PaymentWithOrder | null> {
    return this.db.payment.findUnique({ where: { gatewayRef }, include: { order: true } });
  }

  /** Returns null when another request created the payment first (unique orderId). */
  async createPayment(data: { orderId: string; amount: Prisma.Decimal; gatewayRef: string }): Promise<PaymentWithOrder | null> {
    try {
      return await this.db.payment.create({ data, include: { order: true } });
    } catch (error) {
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  }

  /** FAILED -> UNPAID so the customer can retry with the same payment record. */
  resetFailed(paymentId: string): Promise<Prisma.BatchPayload> {
    return this.db.payment.updateMany({ where: { id: paymentId, status: PaymentStatus.FAILED }, data: { status: PaymentStatus.UNPAID } });
  }

  /**
   * payment.succeeded. Guarded transitions make duplicates harmless:
   *  - payment must still be UNPAID/FAILED/CANCELLED to be claimed (else DUPLICATE, nothing changes)
   *  - order must still be PENDING to be confirmed (else LATE: payment goes REFUND_PENDING, no revival)
   */
  applySuccess(paymentId: string): Promise<SuccessOutcome> {
    return this.db.$transaction(async (tx) => {
      const now = new Date();
      const claimed = await tx.payment.updateMany({
        where: { id: paymentId, status: { in: [PaymentStatus.UNPAID, PaymentStatus.FAILED, PaymentStatus.CANCELLED] } },
        data: { status: PaymentStatus.PAID, paidAt: now },
      });
      if (claimed.count === 0) return 'DUPLICATE' as const;

      const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { order: { select: { userId: true } } } });
      const confirmed = await tx.order.updateMany({
        where: { id: payment.orderId, status: OrderStatus.PENDING },
        data: { status: OrderStatus.CONFIRMED, paymentStatus: PaymentStatus.PAID, confirmedAt: now },
      });
      if (confirmed.count === 1) {
        await tx.user.update({ where: { id: payment.order.userId }, data: { totalOrders: { increment: 1 }, totalSpent: { increment: payment.amount } } });
        return 'CONFIRMED' as const;
      }
      await tx.payment.updateMany({ where: { id: paymentId, status: PaymentStatus.PAID }, data: { status: PaymentStatus.REFUND_PENDING } });
      return 'LATE' as const;
    }, TX_OPTIONS);
  }

  /** payment.failed: only an UNPAID payment can fail; the order stays PENDING. */
  async applyFailure(paymentId: string): Promise<boolean> {
    const result = await this.db.payment.updateMany({ where: { id: paymentId, status: PaymentStatus.UNPAID }, data: { status: PaymentStatus.FAILED } });
    return result.count === 1;
  }

  listRefundPending(limit: number): Promise<{ id: string }[]> {
    return this.db.payment.findMany({ where: { status: PaymentStatus.REFUND_PENDING }, select: { id: true }, orderBy: { updatedAt: 'asc' }, take: limit });
  }

  /** After the gateway confirmed the refund: REFUND_PENDING -> REFUNDED exactly once. */
  completeRefund(paymentId: string): Promise<boolean> {
    return this.db.$transaction(async (tx) => {
      const now = new Date();
      const moved = await tx.payment.updateMany({ where: { id: paymentId, status: PaymentStatus.REFUND_PENDING }, data: { status: PaymentStatus.REFUNDED, refundedAt: now } });
      if (moved.count === 0) return false;
      const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { order: { select: { userId: true } } } });
      const order = await tx.order.updateMany({
        where: { id: payment.orderId, status: OrderStatus.REFUND_PENDING },
        data: { status: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.REFUNDED },
      });
      if (order.count === 1) {
        await tx.user.update({ where: { id: payment.order.userId }, data: { totalSpent: { decrement: payment.amount } } });
      } else {
        // Late payment on an already cancelled order: it was never counted in totalSpent.
        await tx.order.updateMany({ where: { id: payment.orderId, status: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.UNPAID }, data: { paymentStatus: PaymentStatus.REFUNDED } });
      }
      return true;
    }, TX_OPTIONS);
  }
}
