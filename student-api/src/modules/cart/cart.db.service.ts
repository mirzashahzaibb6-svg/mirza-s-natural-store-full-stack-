import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { TX_OPTIONS, type Tx } from '../../database/database.types';
import type { Cart, CartItem, Category, Inventory, Product } from '../../database/prisma';

export type CartItemFull = CartItem & {
  product: Product & { category: Pick<Category, 'isActive'>; inventory: Pick<Inventory, 'qtyOnHand' | 'status'> | null };
};
export type CartFull = Cart & { items: CartItemFull[] };

const ITEMS_INCLUDE = {
  items: {
    orderBy: { createdAt: 'asc' as const },
    include: { product: { include: { category: { select: { isActive: true } }, inventory: { select: { qtyOnHand: true, status: true } } } } },
  },
};

@Injectable()
export class CartDbService {
  constructor(private readonly db: DatabaseService) {}

  /** One cart per user, created lazily. */
  getOrCreate(userId: string): Promise<CartFull> {
    return this.db.cart.upsert({ where: { userId }, update: {}, create: { userId }, include: ITEMS_INCLUDE });
  }

  /** Runs a read-validate-write unit atomically. */
  transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.db.$transaction(fn, TX_OPTIONS);
  }

  async cartIdFor(tx: Tx, userId: string): Promise<string> {
    const cart = await tx.cart.upsert({ where: { userId }, update: {}, create: { userId }, select: { id: true } });
    return cart.id;
  }

  getProductForCart(tx: Tx, productId: string): Promise<(Product & { category: Pick<Category, 'isActive'>; inventory: Pick<Inventory, 'qtyOnHand'> | null }) | null> {
    return tx.product.findUnique({ where: { id: productId }, include: { category: { select: { isActive: true } }, inventory: { select: { qtyOnHand: true } } } });
  }

  findItem(tx: Tx, cartId: string, productId: string): Promise<CartItem | null> {
    return tx.cartItem.findUnique({ where: { cartId_productId: { cartId, productId } } });
  }

  findOwnedItem(tx: Tx, itemId: string, userId: string): Promise<(CartItem & { product: Product & { category: Pick<Category, 'isActive'>; inventory: Pick<Inventory, 'qtyOnHand'> | null } }) | null> {
    return tx.cartItem.findFirst({
      where: { id: itemId, cart: { userId } },
      include: { product: { include: { category: { select: { isActive: true } }, inventory: { select: { qtyOnHand: true } } } } },
    });
  }

  upsertItem(tx: Tx, cartId: string, productId: string, quantity: number): Promise<CartItem> {
    return tx.cartItem.upsert({
      where: { cartId_productId: { cartId, productId } },
      update: { quantity },
      create: { cartId, productId, quantity },
    });
  }

  setItemQuantity(tx: Tx, itemId: string, quantity: number): Promise<CartItem> {
    return tx.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }

  deleteItem(tx: Tx, itemId: string): Promise<CartItem> {
    return tx.cartItem.delete({ where: { id: itemId } });
  }

  async clear(userId: string): Promise<void> {
    await this.db.cartItem.deleteMany({ where: { cart: { userId } } });
  }
}
