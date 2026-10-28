import { Injectable } from '@nestjs/common';
import { toSkip } from '../../common/pagination/pagination';
import { DatabaseService } from '../../database/database.service';
import { TX_OPTIONS, type Tx } from '../../database/database.types';
import { InventoryMovementType, OrderStatus, PaymentStatus, Prisma, type IdempotencyKey } from '../../database/prisma';
import { ORDER_INCLUDE, type OrderFull } from './order.mapper';

export type CheckoutCart = Prisma.CartGetPayload<{
  include: { items: { include: { product: { include: { category: { select: { isActive: true } } } } } } };
}>;

@Injectable()
export class OrdersDbService {
  constructor(private readonly db: DatabaseService) {}

  transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.db.$transaction(fn, TX_OPTIONS);
  }

  // ---- idempotency
  findIdempotency(userId: string, key: string): Promise<IdempotencyKey | null> {
    return this.db.idempotencyKey.findUnique({ where: { userId_key: { userId, key } } });
  }
  createIdempotency(tx: Tx, userId: string, key: string, requestHash: string): Promise<IdempotencyKey> {
    return tx.idempotencyKey.create({ data: { userId, key, requestHash } });
  }
  attachOrder(tx: Tx, idempotencyId: string, orderId: string): Promise<IdempotencyKey> {
    return tx.idempotencyKey.update({ where: { id: idempotencyId }, data: { orderId } });
  }

  // ---- checkout
  getCheckoutCart(tx: Tx, userId: string): Promise<CheckoutCart | null> {
    return tx.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: { include: { category: { select: { isActive: true } } } } } } },
    });
  }
  findOwnedAddress(tx: Tx, id: string, userId: string) {
    return tx.address.findFirst({ where: { id, userId } });
  }
  async nextOrderSequence(tx: Tx): Promise<number> {
    const rows = await tx.$queryRaw<{ n: bigint }[]>`SELECT nextval('order_number_seq') AS n`;
    return Number(rows[0].n);
  }
  createOrder(tx: Tx, data: Prisma.OrderUncheckedCreateInput): Promise<{ id: string }> {
    return tx.order.create({ data, select: { id: true } });
  }
  async clearCart(tx: Tx, cartId: string): Promise<void> {
    await tx.cartItem.deleteMany({ where: { cartId } });
  }

  // ---- queries
  findDetail(id: string, userId?: string): Promise<OrderFull | null> {
    return this.db.order.findFirst({ where: { id, ...(userId ? { userId } : {}) }, include: ORDER_INCLUDE });
  }
  async list(where: Prisma.OrderWhereInput, page: number, limit: number): Promise<{ rows: OrderFull[]; total: number }> {
    const [total, rows] = await this.db.$transaction([
      this.db.order.count({ where }),
      this.db.order.findMany({ where, include: ORDER_INCLUDE, orderBy: { createdAt: 'desc' }, skip: toSkip(page, limit), take: limit }),
    ]);
    return { rows, total };
  }

  // ---- status workflow
  async guardedStatusUpdate(id: string, expected: OrderStatus, data: Prisma.OrderUncheckedUpdateManyInput): Promise<number> {
    const result = await this.db.order.updateMany({ where: { id, status: expected }, data });
    return result.count;
  }

  // ---- cancellation (all take the transaction client)
  findForCancel(tx: Tx, id: string, userId?: string) {
    return tx.order.findFirst({ where: { id, ...(userId ? { userId } : {}) }, include: { payment: true } });
  }
  async guardedCancel(tx: Tx, id: string, expected: OrderStatus, data: Prisma.OrderUncheckedUpdateManyInput, expiredBefore?: Date): Promise<number> {
    const result = await tx.order.updateMany({
      where: { id, status: expected, ...(expiredBefore ? { paymentExpiresAt: { lt: expiredBefore } } : {}) },
      data,
    });
    return result.count;
  }
  async currentStatus(tx: Tx, id: string): Promise<OrderStatus | null> {
    const row = await tx.order.findUnique({ where: { id }, select: { status: true } });
    return row?.status ?? null;
  }
  consumedMovements(tx: Tx, orderId: string) {
    return tx.inventoryTransaction.findMany({ where: { orderId, type: InventoryMovementType.CONSUMED }, orderBy: { inventoryId: 'asc' } });
  }
  async cancelOpenPayment(tx: Tx, orderId: string): Promise<void> {
    await tx.payment.updateMany({ where: { orderId, status: { in: [PaymentStatus.UNPAID, PaymentStatus.FAILED] } }, data: { status: PaymentStatus.CANCELLED } });
  }
  async setPaymentRefundPending(tx: Tx, orderId: string): Promise<void> {
    await tx.payment.updateMany({ where: { orderId, status: PaymentStatus.PAID }, data: { status: PaymentStatus.REFUND_PENDING } });
  }

  // ---- cron
  async findExpiredPendingIds(now: Date, limit: number): Promise<string[]> {
    const rows = await this.db.order.findMany({
      where: { status: OrderStatus.PENDING, paymentExpiresAt: { lt: now } },
      select: { id: true }, orderBy: { paymentExpiresAt: 'asc' }, take: limit,
    });
    return rows.map((r) => r.id);
  }

}
