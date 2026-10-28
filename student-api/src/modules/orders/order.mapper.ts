import type { Prisma } from '../../database/prisma';
import { formatMoney } from '../../shared/money/format';
import { nextAdminStatuses } from './types/order-transitions';
import type { OrderResponse } from './types/order.types';

export const ORDER_INCLUDE = {
  items: true,
  address: true,
  payment: true,
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.OrderInclude;

export type OrderFull = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);

export function toOrderResponse(o: OrderFull, opts: { admin?: boolean } = {}): OrderResponse {
  const response: OrderResponse = {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    deliveryType: o.deliveryType,
    items: o.items.map((i) => ({
      productId: i.productId, productName: i.productName, sku: i.sku,
      unitPrice: formatMoney(i.unitPrice), quantity: i.quantity, lineTotal: formatMoney(i.lineTotal),
    })),
    address: o.address ? { addressLine: o.address.addressLine, city: o.address.city, county: o.address.county, postcode: o.address.postcode } : null,
    subtotal: formatMoney(o.subtotal),
    shippingCost: formatMoney(o.shippingCost),
    total: formatMoney(o.total),
    customerNotes: o.customerNotes,
    pickupScheduledAt: iso(o.pickupScheduledAt),
    paymentExpiresAt: o.paymentExpiresAt.toISOString(),
    payment: o.payment ? { id: o.payment.id, status: o.payment.status, amount: formatMoney(o.payment.amount) } : null,
    cancelReason: o.cancelReason,
    cancelNote: o.cancelNote,
    cancelledBy: o.cancelledBy,
    confirmedAt: iso(o.confirmedAt),
    processedAt: iso(o.processedAt),
    readyAt: iso(o.readyAt),
    deliveredAt: iso(o.deliveredAt),
    cancelledAt: iso(o.cancelledAt),
    createdAt: o.createdAt.toISOString(),
  };
  if (opts.admin) {
    response.customer = { id: o.user.id, name: o.user.name, email: o.user.email };
    response.nextStatuses = nextAdminStatuses(o);
  }
  return response;
}
