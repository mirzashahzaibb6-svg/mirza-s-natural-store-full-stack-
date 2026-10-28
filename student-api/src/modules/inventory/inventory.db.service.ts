import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { toSkip } from '../../common/pagination/pagination';
import { DatabaseService } from '../../database/database.service';
import { TX_OPTIONS, type Tx } from '../../database/database.types';
import { isUniqueViolation } from '../../database/db-errors';
import { InventoryMovementType, Prisma, type Inventory, type InventoryTransaction, type Product, type StockStatus } from '../../database/prisma';
import { computeStockStatus } from './stock-status';

export type InventoryWithProduct = Inventory & { product: Pick<Product, 'name' | 'sku'> };
export interface LockedInventory {
  id: string;
  productId: string;
  qtyOnHand: number;
  lowStockThreshold: number;
}

@Injectable()
export class InventoryDbService {
  constructor(private readonly db: DatabaseService) {}

  /** Parameterized row lock: SELECT ... FOR UPDATE (must run inside a transaction). */
  async lockById(tx: Tx, inventoryId: string): Promise<LockedInventory | null> {
    const rows = await tx.$queryRaw<LockedInventory[]>(
      Prisma.sql`SELECT "id", "productId", "qtyOnHand", "lowStockThreshold" FROM "inventories" WHERE "id" = ${inventoryId}::uuid FOR UPDATE`,
    );
    return rows[0] ?? null;
  }

  async lockByProductId(tx: Tx, productId: string): Promise<LockedInventory | null> {
    const rows = await tx.$queryRaw<LockedInventory[]>(
      Prisma.sql`SELECT "id", "productId", "qtyOnHand", "lowStockThreshold" FROM "inventories" WHERE "productId" = ${productId}::uuid FOR UPDATE`,
    );
    return rows[0] ?? null;
  }

  /** Writes new quantity + recomputed status + ledger row. Caller must hold the row lock. */
  async applyMovement(
    tx: Tx,
    inv: LockedInventory,
    delta: number,
    type: InventoryMovementType,
    meta: { reason?: string; note?: string; orderId?: string },
  ): Promise<number> {
    const quantityAfter = inv.qtyOnHand + delta;
    const status: StockStatus = computeStockStatus(quantityAfter, inv.lowStockThreshold);
    await tx.inventory.update({ where: { id: inv.id }, data: { qtyOnHand: quantityAfter, status } });
    await tx.inventoryTransaction.create({
      data: { inventoryId: inv.id, type, quantity: delta, quantityAfter, reason: meta.reason ?? null, note: meta.note ?? null, orderId: meta.orderId ?? null },
    });
    return quantityAfter;
  }

  async create(productId: string, qtyOnHand: number, lowStockThreshold: number): Promise<InventoryWithProduct> {
    const product = await this.db.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) throw new NotFoundException('Product not found');
    try {
      return await this.db.$transaction(async (tx) => {
        const created = await tx.inventory.create({
          data: { productId, qtyOnHand, lowStockThreshold, status: computeStockStatus(qtyOnHand, lowStockThreshold) },
          include: { product: { select: { name: true, sku: true } } },
        });
        if (qtyOnHand > 0) {
          await tx.inventoryTransaction.create({
            data: { inventoryId: created.id, type: InventoryMovementType.RECEIVED, quantity: qtyOnHand, quantityAfter: qtyOnHand, reason: 'RECEIVED_STOCK', note: 'Initial stock' },
          });
        }
        return created;
      }, TX_OPTIONS);
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('Inventory already exists for this product');
      throw error;
    }
  }

  /** Adjust under a row lock so two admins cannot race; negative stock is rejected. */
  adjust(inventoryId: string, delta: number, type: InventoryMovementType, reason: string, note?: string): Promise<{ inv: InventoryWithProduct }> {
    return this.db.$transaction(async (tx) => {
      const locked = await this.lockById(tx, inventoryId);
      if (!locked) throw new NotFoundException('Inventory record not found');
      if (locked.qtyOnHand + delta < 0) {
        throw new ConflictException(`Insufficient stock: on hand ${locked.qtyOnHand}, requested change ${delta}`);
      }
      await this.applyMovement(tx, locked, delta, type, { reason, note });
      const inv = await tx.inventory.findUniqueOrThrow({ where: { id: inventoryId }, include: { product: { select: { name: true, sku: true } } } });
      return { inv };
    }, TX_OPTIONS);
  }

  async list(query: { page: number; limit: number; search?: string; stockStatus?: StockStatus }): Promise<{ rows: InventoryWithProduct[]; total: number }> {
    const where: Prisma.InventoryWhereInput = {
      ...(query.stockStatus ? { status: query.stockStatus } : {}),
      ...(query.search
        ? { product: { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { sku: { contains: query.search, mode: 'insensitive' } }] } }
        : {}),
    };
    const [total, rows] = await this.db.$transaction([
      this.db.inventory.count({ where }),
      this.db.inventory.findMany({
        where, include: { product: { select: { name: true, sku: true } } }, orderBy: { updatedAt: 'desc' },
        skip: toSkip(query.page, query.limit), take: query.limit,
      }),
    ]);
    return { rows, total };
  }

  async transactions(inventoryId: string, page: number, limit: number): Promise<{ rows: InventoryTransaction[]; total: number } | null> {
    const exists = await this.db.inventory.findUnique({ where: { id: inventoryId }, select: { id: true } });
    if (!exists) return null;
    const where = { inventoryId };
    const [total, rows] = await this.db.$transaction([
      this.db.inventoryTransaction.count({ where }),
      this.db.inventoryTransaction.findMany({ where, orderBy: { createdAt: 'desc' }, skip: toSkip(page, limit), take: limit }),
    ]);
    return { rows, total };
  }
}
