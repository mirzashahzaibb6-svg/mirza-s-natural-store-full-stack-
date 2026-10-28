import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '../../database/prisma';
import { OrdersDbService } from './orders.db.service';
import { OrderQueryService } from './order-query.service';
import { isAllowedAdminTransition, nextAdminStatuses, timestampFieldFor } from './types/order-transitions';
import type { OrderResponse } from './types/order.types';

@Injectable()
export class OrderStatusService {
  private readonly logger = new Logger(OrderStatusService.name);

  constructor(private readonly ordersDb: OrdersDbService, private readonly queries: OrderQueryService) {}

  async updateStatus(adminId: string, orderId: string, target: OrderStatus): Promise<OrderResponse> {
    const order = await this.queries.getAdmin(orderId); // 404 if missing
    if (target === OrderStatus.CANCELLED || target === OrderStatus.REFUND_PENDING) {
      throw new BadRequestException('Use the cancel endpoint to cancel an order');
    }
    if (!isAllowedAdminTransition(order, target)) {
      const allowed = nextAdminStatuses(order);
      throw new BadRequestException(
        allowed.length ? `Cannot move order from ${order.status} to ${target}. Allowed: ${allowed.join(', ')}` : `Order in status ${order.status} cannot be advanced`,
      );
    }
    const field = timestampFieldFor(target);
    // Guarded update: only succeeds if the status is STILL what we read (race => 409).
    const changed = await this.ordersDb.guardedStatusUpdate(orderId, order.status, { status: target, ...(field ? { [field]: new Date() } : {}) });
    if (changed === 0) throw new ConflictException('Order status changed in the meantime. Please refresh and try again.');
    this.logger.log(`admin=${adminId} order=${orderId} ${order.status} -> ${target}`);
    return this.queries.getAdmin(orderId);
  }
}
