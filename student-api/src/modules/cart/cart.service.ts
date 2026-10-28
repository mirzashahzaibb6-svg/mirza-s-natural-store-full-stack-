import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MoneyService } from '../../shared/money/money.service';
import { CartDbService } from './cart.db.service';
import { maxAllowedQuantity, toCartResponse } from './cart.mapper';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';
import type { CartResponse } from './types';

interface Rules {
  isActive: boolean;
  name: string;
  minimumOrderQuantity: number;
  maximumOrderQuantity: number;
  category: { isActive: boolean };
  inventory: { qtyOnHand: number } | null;
}

@Injectable()
export class CartService {
  constructor(private readonly cartDb: CartDbService, private readonly money: MoneyService) {}

  async get(userId: string): Promise<CartResponse> {
    return toCartResponse(await this.cartDb.getOrCreate(userId), this.money);
  }

  /** POST increments the quantity (documented, not idempotent). Prices always come from the server. */
  async addItem(userId: string, dto: AddCartItemDto): Promise<CartResponse> {
    await this.cartDb.transaction(async (tx) => {
      const product = await this.cartDb.getProductForCart(tx, dto.productId);
      if (!product || !product.isActive || !product.category.isActive) throw new NotFoundException('Product not found');
      const available = product.inventory?.qtyOnHand ?? 0;
      if (available <= 0) throw new BadRequestException(`${product.name} is out of stock`);
      const cartId = await this.cartDb.cartIdFor(tx, userId);
      const existing = await this.cartDb.findItem(tx, cartId, dto.productId);
      if (!existing && dto.quantity < product.minimumOrderQuantity) {
        throw new BadRequestException(`Minimum order quantity for ${product.name} is ${product.minimumOrderQuantity}`);
      }
      const total = (existing?.quantity ?? 0) + dto.quantity;
      this.assertWithinMax(product, total, available);
      await this.cartDb.upsertItem(tx, cartId, dto.productId, total);
    });
    return this.get(userId);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto): Promise<CartResponse> {
    await this.cartDb.transaction(async (tx) => {
      const item = await this.cartDb.findOwnedItem(tx, itemId, userId);
      if (!item) throw new NotFoundException('Cart item not found');
      if (dto.quantity === 0) {
        await this.cartDb.deleteItem(tx, item.id);
        return;
      }
      const available = item.product.inventory?.qtyOnHand ?? 0;
      if (dto.quantity < item.product.minimumOrderQuantity) {
        throw new BadRequestException(`Minimum order quantity for ${item.product.name} is ${item.product.minimumOrderQuantity}`);
      }
      this.assertWithinMax(item.product, dto.quantity, available);
      await this.cartDb.setItemQuantity(tx, item.id, dto.quantity);
    });
    return this.get(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<void> {
    await this.cartDb.transaction(async (tx) => {
      const item = await this.cartDb.findOwnedItem(tx, itemId, userId);
      if (!item) throw new NotFoundException('Cart item not found');
      await this.cartDb.deleteItem(tx, item.id);
    });
  }

  clear(userId: string): Promise<void> {
    return this.cartDb.clear(userId);
  }

  private assertWithinMax(product: Rules, quantity: number, available: number): void {
    const max = maxAllowedQuantity(product, available);
    if (quantity > max) {
      throw new BadRequestException(`Only ${max} of ${product.name} can be ordered right now (stock ${available}, limit ${product.maximumOrderQuantity})`);
    }
  }
}
