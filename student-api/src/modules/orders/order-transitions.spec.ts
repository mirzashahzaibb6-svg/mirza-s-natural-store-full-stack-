import { BadRequestException } from '@nestjs/common';
import { DeliveryType, OrderStatus } from '../../database/prisma';
import { validateDeliveryInput } from './order-rules';
import { formatOrderNumber } from './order-rules';
import { isAllowedAdminTransition, nextAdminStatuses, timestampFieldFor } from './types/order-transitions';

describe('admin status workflow', () => {
  const pickup = (status: OrderStatus) => ({ status, deliveryType: DeliveryType.PICKUP });
  const delivery = (status: OrderStatus) => ({ status, deliveryType: DeliveryType.DELIVERY });

  it('follows CONFIRMED -> PROCESSING -> READY_* -> DELIVERED', () => {
    expect(nextAdminStatuses(pickup(OrderStatus.CONFIRMED))).toEqual([OrderStatus.PROCESSING]);
    expect(nextAdminStatuses(pickup(OrderStatus.PROCESSING))).toEqual([OrderStatus.READY_FOR_PICKUP]);
    expect(nextAdminStatuses(delivery(OrderStatus.PROCESSING))).toEqual([OrderStatus.READY_FOR_DELIVERY]);
    expect(nextAdminStatuses(delivery(OrderStatus.READY_FOR_DELIVERY))).toEqual([OrderStatus.DELIVERED]);
  });
  it('blocks every other jump', () => {
    expect(isAllowedAdminTransition(pickup(OrderStatus.PENDING), OrderStatus.PROCESSING)).toBe(false);
    expect(isAllowedAdminTransition(pickup(OrderStatus.CONFIRMED), OrderStatus.DELIVERED)).toBe(false);
    expect(isAllowedAdminTransition(delivery(OrderStatus.PROCESSING), OrderStatus.READY_FOR_PICKUP)).toBe(false);
    expect(nextAdminStatuses(pickup(OrderStatus.DELIVERED))).toEqual([]);
    expect(nextAdminStatuses(pickup(OrderStatus.CANCELLED))).toEqual([]);
  });
  it('stamps the right timestamp', () => {
    expect(timestampFieldFor(OrderStatus.PROCESSING)).toBe('processedAt');
    expect(timestampFieldFor(OrderStatus.READY_FOR_PICKUP)).toBe('readyAt');
    expect(timestampFieldFor(OrderStatus.DELIVERED)).toBe('deliveredAt');
    expect(timestampFieldFor(OrderStatus.CONFIRMED)).toBeNull();
  });
});

describe('delivery input rules', () => {
  const future = new Date(Date.now() + 3_600_000).toISOString();
  const addr = { addressLine: 'x', city: 'y', county: 'z', postcode: 'p' };

  it('DELIVERY needs exactly one address source', () => {
    expect(() => validateDeliveryInput({ deliveryType: DeliveryType.DELIVERY })).toThrow(BadRequestException);
    expect(() => validateDeliveryInput({ deliveryType: DeliveryType.DELIVERY, addressId: 'a', shippingAddress: addr })).toThrow(BadRequestException);
    expect(() => validateDeliveryInput({ deliveryType: DeliveryType.DELIVERY, addressId: 'a' })).not.toThrow();
    expect(() => validateDeliveryInput({ deliveryType: DeliveryType.DELIVERY, shippingAddress: addr })).not.toThrow();
  });
  it('DELIVERY must not have a pickup time', () => {
    expect(() => validateDeliveryInput({ deliveryType: DeliveryType.DELIVERY, addressId: 'a', pickupScheduledAt: future })).toThrow(BadRequestException);
  });
  it('PICKUP needs a future time and no address', () => {
    expect(() => validateDeliveryInput({ deliveryType: DeliveryType.PICKUP })).toThrow(BadRequestException);
    expect(() => validateDeliveryInput({ deliveryType: DeliveryType.PICKUP, pickupScheduledAt: new Date(Date.now() - 1000).toISOString() })).toThrow(BadRequestException);
    expect(() => validateDeliveryInput({ deliveryType: DeliveryType.PICKUP, pickupScheduledAt: future, addressId: 'a' })).toThrow(BadRequestException);
    expect(() => validateDeliveryInput({ deliveryType: DeliveryType.PICKUP, pickupScheduledAt: future })).not.toThrow();
  });
  it('formats order numbers', () => {
    expect(formatOrderNumber(2026, 42)).toBe('ORD-2026-000042');
  });
});
