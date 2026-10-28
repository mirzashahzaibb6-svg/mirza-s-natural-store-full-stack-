import { DeliveryType, OrderStatus } from '../../../database/prisma';

type OrderLike = { status: OrderStatus; deliveryType: DeliveryType };

/** The admin fulfilment workflow. Cancellation has its own endpoint. */
export function nextAdminStatuses(order: OrderLike): OrderStatus[] {
  switch (order.status) {
    case OrderStatus.CONFIRMED:
      return [OrderStatus.PROCESSING];
    case OrderStatus.PROCESSING:
      return [order.deliveryType === DeliveryType.PICKUP ? OrderStatus.READY_FOR_PICKUP : OrderStatus.READY_FOR_DELIVERY];
    case OrderStatus.READY_FOR_PICKUP:
    case OrderStatus.READY_FOR_DELIVERY:
      return [OrderStatus.DELIVERED];
    default:
      return [];
  }
}

export const isAllowedAdminTransition = (order: OrderLike, target: OrderStatus): boolean => nextAdminStatuses(order).includes(target);

export const CUSTOMER_CANCELLABLE: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED];
export const ADMIN_CANCELLABLE: OrderStatus[] = [
  OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.READY_FOR_PICKUP, OrderStatus.READY_FOR_DELIVERY,
];
export const SYSTEM_CANCELLABLE: OrderStatus[] = [OrderStatus.PENDING];

/** Which timestamp column is stamped when an order enters a status. */
export function timestampFieldFor(status: OrderStatus): 'processedAt' | 'readyAt' | 'deliveredAt' | null {
  if (status === OrderStatus.PROCESSING) return 'processedAt';
  if (status === OrderStatus.READY_FOR_PICKUP || status === OrderStatus.READY_FOR_DELIVERY) return 'readyAt';
  if (status === OrderStatus.DELIVERED) return 'deliveredAt';
  return null;
}
