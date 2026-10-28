import { StockStatus } from '../../database/prisma';
import type { MoneyService } from '../../shared/money/money.service';
import type { CartFull, CartItemFull } from './cart.db.service';
import type { CartItemResponse, CartResponse } from './types';

export function maxAllowedQuantity(product: { maximumOrderQuantity: number }, available: number): number {
  return Math.max(0, Math.min(available, product.maximumOrderQuantity));
}

export function toCartItemResponse(item: CartItemFull, money: MoneyService): CartItemResponse {
  const available = item.product.inventory?.qtyOnHand ?? 0;
  const live = item.product.isActive && item.product.category.isActive;
  return {
    id: item.id,
    productId: item.productId,
    name: item.product.name,
    sku: item.product.sku,
    unitPrice: money.format(item.product.price), // always the CURRENT server price
    quantity: item.quantity,
    lineTotal: money.format(money.lineTotal(item.product.price, item.quantity)),
    minimumOrderQuantity: item.product.minimumOrderQuantity,
    maxAllowedQuantity: maxAllowedQuantity(item.product, available),
    isAvailable: live && available >= item.quantity,
    stockStatus: item.product.inventory?.status ?? StockStatus.OUT_OF_STOCK,
  };
}

export function toCartResponse(cart: CartFull, money: MoneyService): CartResponse {
  const subtotal = money.sum(cart.items.map((i) => money.lineTotal(i.product.price, i.quantity)));
  const shipping = cart.items.length > 0 ? money.shippingCost() : money.sum([]);
  return {
    id: cart.id,
    items: cart.items.map((i) => toCartItemResponse(i, money)),
    subtotal: money.format(subtotal),
    shippingCost: money.format(shipping),
    grandTotal: money.format(subtotal.add(shipping)),
  };
}
