import { Injectable, NotFoundException } from '@nestjs/common';
import { paginated } from '../../common/pagination/pagination';
import type { Paginated } from '../../common/types';
import type { Prisma } from '../../database/prisma';
import { AdminListOrdersQueryDto, ListMyOrdersQueryDto } from './dto/order.dto';
import { toOrderResponse } from './order.mapper';
import { OrdersDbService } from './orders.db.service';
import type { OrderResponse } from './types/order.types';

@Injectable()
export class OrderQueryService {
  constructor(private readonly ordersDb: OrdersDbService) {}

  async listMine(userId: string, q: ListMyOrdersQueryDto): Promise<Paginated<OrderResponse>> {
    const where: Prisma.OrderWhereInput = { userId, ...(q.status ? { status: q.status } : {}) };
    const { rows, total } = await this.ordersDb.list(where, q.page, q.limit);
    return paginated(rows.map((o) => toOrderResponse(o)), total, q.page, q.limit);
  }

  /** Scoped by { id, userId }: someone else's order is a 404, never a 403 (no id probing). */
  async getMine(userId: string, id: string): Promise<OrderResponse> {
    const order = await this.ordersDb.findDetail(id, userId);
    if (!order) throw new NotFoundException('Order not found');
    return toOrderResponse(order);
  }

  async listAdmin(q: AdminListOrdersQueryDto): Promise<Paginated<OrderResponse>> {
    const createdAt: Prisma.DateTimeFilter = {};
    if (q.dateFrom) createdAt.gte = new Date(q.dateFrom);
    if (q.dateTo) createdAt.lte = new Date(q.dateTo.length === 10 ? `${q.dateTo}T23:59:59.999Z` : q.dateTo);
    const where: Prisma.OrderWhereInput = {
      ...(q.status ? { status: q.status } : {}),
      ...(q.paymentStatus ? { paymentStatus: q.paymentStatus } : {}),
      ...(Object.keys(createdAt).length ? { createdAt } : {}),
      ...(q.search
        ? { OR: [
            { orderNumber: { contains: q.search, mode: 'insensitive' } },
            { user: { email: { contains: q.search, mode: 'insensitive' } } },
            { user: { name: { contains: q.search, mode: 'insensitive' } } },
          ] }
        : {}),
    };
    const { rows, total } = await this.ordersDb.list(where, q.page, q.limit);
    return paginated(rows.map((o) => toOrderResponse(o, { admin: true })), total, q.page, q.limit);
  }

  async getAdmin(id: string): Promise<OrderResponse> {
    const order = await this.ordersDb.findDetail(id);
    if (!order) throw new NotFoundException('Order not found');
    return toOrderResponse(order, { admin: true });
  }
}
