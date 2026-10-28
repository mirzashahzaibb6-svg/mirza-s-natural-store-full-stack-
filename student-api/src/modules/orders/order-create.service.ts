import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { PAYMENT_WINDOW_MINUTES } from '../../common/constants';
import type { Tx } from '../../database/database.types';
import { isUniqueViolation } from '../../database/db-errors';
import { DeliveryType, InventoryMovementType, type IdempotencyKey } from '../../database/prisma';
import { MoneyService } from '../../shared/money/money.service';
import { InventoryDbService } from '../inventory/inventory.db.service';
import { CreateOrderDto } from './dto/order.dto';
import { formatOrderNumber, validateDeliveryInput } from './order-rules';
import { OrdersDbService } from './orders.db.service';
import { OrderQueryService } from './order-query.service';
import type { OrderResponse } from './types/order.types';

@Injectable()
export class OrderCreateService {
  private readonly logger = new Logger(OrderCreateService.name);

  constructor(
    private readonly ordersDb: OrdersDbService,
    private readonly inventoryDb: InventoryDbService,
    private readonly money: MoneyService,
    private readonly queries: OrderQueryService,
  ) {}

  async create(userId: string, dto: CreateOrderDto, idempotencyKey: string): Promise<OrderResponse> {
    validateDeliveryInput(dto);
    const requestHash = this.hash(dto);

    const existing = await this.ordersDb.findIdempotency(userId, idempotencyKey);
    if (existing) return this.replay(existing, requestHash, userId);

    let orderId: string;
    try {
      orderId = await this.ordersDb.transaction((tx) => this.buildOrder(tx, userId, dto, idempotencyKey, requestHash));
    } catch (error) {
      if (isUniqueViolation(error)) {
        // Parallel request with the same key won the race: return ITS order.
        const winner = await this.ordersDb.findIdempotency(userId, idempotencyKey);
        if (winner) return this.replay(winner, requestHash, userId);
      }
      throw error;
    }
    this.logger.log(`order created id=${orderId} user=${userId}`); // notifications would run here, after commit
    return this.queries.getMine(userId, orderId);
  }

  private async replay(record: IdempotencyKey, requestHash: string, userId: string): Promise<OrderResponse> {
    if (record.requestHash !== requestHash) throw new ConflictException('This Idempotency-Key was already used with a different request');
    if (!record.orderId) throw new ConflictException('A request with this Idempotency-Key is still being processed');
    return this.queries.getMine(userId, record.orderId);
  }

  private hash(dto: CreateOrderDto): string {
    const canonical = {
      deliveryType: dto.deliveryType, addressId: dto.addressId ?? null, pickupScheduledAt: dto.pickupScheduledAt ?? null,
      customerNotes: dto.customerNotes ?? null,
      shippingAddress: dto.shippingAddress
        ? { addressLine: dto.shippingAddress.addressLine, city: dto.shippingAddress.city, county: dto.shippingAddress.county, postcode: dto.shippingAddress.postcode }
        : null,
    };
    return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
  }

  /** Everything below is ONE database transaction: any thrown error rolls the whole order back. */
  private async buildOrder(tx: Tx, userId: string, dto: CreateOrderDto, key: string, requestHash: string): Promise<string> {
    // 1) Claim the idempotency key first: a parallel duplicate blocks here, then fails with P2002.
    const idem = await this.ordersDb.createIdempotency(tx, userId, key, requestHash);

    // 2) Read the cart.
    const cart = await this.ordersDb.getCheckoutCart(tx, userId);
    if (!cart || cart.items.length === 0) throw new BadRequestException('Cart is empty');

    // 3) Delivery snapshot.
    let address: { addressLine: string; city: string; county: string; postcode: string } | null = null;
    if (dto.deliveryType === DeliveryType.DELIVERY) {
      if (dto.addressId) {
        const saved = await this.ordersDb.findOwnedAddress(tx, dto.addressId, userId);
        if (!saved) throw new NotFoundException('Address not found');
        address = { addressLine: saved.addressLine, city: saved.city, county: saved.county, postcode: saved.postcode };
      } else if (dto.shippingAddress) {
        address = { ...dto.shippingAddress };
      }
    }

    // 4) Lock inventory rows in a stable order (sorted by product id) => no deadlocks between two checkouts.
    const items = [...cart.items].sort((a, b) => a.productId.localeCompare(b.productId));
    const orderId = randomUUID();
    const plan: Array<{ item: (typeof items)[number]; locked: NonNullable<Awaited<ReturnType<InventoryDbService['lockByProductId']>>> }> = [];
    for (const item of items) {
      const p = item.product;
      if (!p.isActive || !p.category.isActive) throw new BadRequestException(`"${p.name}" is no longer available`);
      if (item.quantity < p.minimumOrderQuantity || item.quantity > p.maximumOrderQuantity) {
        throw new BadRequestException(`Quantity for "${p.name}" must be between ${p.minimumOrderQuantity} and ${p.maximumOrderQuantity}`);
      }
      const locked = await this.inventoryDb.lockByProductId(tx, item.productId);
      if (!locked || locked.qtyOnHand < item.quantity) throw new BadRequestException(`Insufficient stock for "${p.name}"`);
      plan.push({ item, locked });
    }

    // 5) Totals from SERVER prices (never from the client).
    const lineTotals = plan.map(({ item }) => this.money.lineTotal(item.product.price, item.quantity));
    const subtotal = this.money.sum(lineTotals);
    const shippingCost = this.money.shippingCost();
    const total = this.money.orderTotal(subtotal);

    // 6) Order + items + address snapshot.
    const sequence = await this.ordersDb.nextOrderSequence(tx);
    const now = new Date();
    await this.ordersDb.createOrder(tx, {
      id: orderId,
      orderNumber: formatOrderNumber(now.getFullYear(), sequence),
      userId,
      deliveryType: dto.deliveryType,
      subtotal, shippingCost, total,
      customerNotes: dto.customerNotes ?? null,
      pickupScheduledAt: dto.pickupScheduledAt ? new Date(dto.pickupScheduledAt) : null,
      paymentExpiresAt: new Date(now.getTime() + PAYMENT_WINDOW_MINUTES * 60_000),
      items: {
        create: plan.map(({ item }, i) => ({
          productId: item.productId, productName: item.product.name, sku: item.product.sku,
          unitPrice: item.product.price, quantity: item.quantity, lineTotal: lineTotals[i],
        })),
      },
      ...(address ? { address: { create: address } } : {}),
    });

    // 7) Deduct stock + CONSUMED ledger rows, empty the cart, link the idempotency record.
    for (const { item, locked } of plan) {
      await this.inventoryDb.applyMovement(tx, locked, -item.quantity, InventoryMovementType.CONSUMED, { orderId, reason: 'ORDER_PLACED' });
    }
    await this.ordersDb.clearCart(tx, cart.id);
    await this.ordersDb.attachOrder(tx, idem.id, orderId);
    return orderId;
  }
}
