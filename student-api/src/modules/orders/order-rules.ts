import { BadRequestException } from '@nestjs/common';
import { DeliveryType } from '../../database/prisma';

export interface DeliveryInput {
  deliveryType: DeliveryType;
  addressId?: string;
  shippingAddress?: unknown;
  pickupScheduledAt?: string;
}

/** Cross-field delivery rules. Throws 400 with a clear message. */
export function validateDeliveryInput(dto: DeliveryInput, now: Date = new Date()): void {
  if (dto.deliveryType === DeliveryType.DELIVERY) {
    const hasSaved = dto.addressId !== undefined;
    const hasInline = dto.shippingAddress !== undefined;
    if (hasSaved === hasInline) throw new BadRequestException('DELIVERY requires exactly one of addressId or shippingAddress');
    if (dto.pickupScheduledAt !== undefined) throw new BadRequestException('pickupScheduledAt is only allowed for PICKUP orders');
    return;
  }
  if (dto.addressId !== undefined || dto.shippingAddress !== undefined) {
    throw new BadRequestException('PICKUP orders must not include an address');
  }
  if (!dto.pickupScheduledAt) throw new BadRequestException('PICKUP requires pickupScheduledAt');
  const when = new Date(dto.pickupScheduledAt);
  if (Number.isNaN(when.getTime()) || when.getTime() <= now.getTime()) {
    throw new BadRequestException('pickupScheduledAt must be a future date and time');
  }
}

export function formatOrderNumber(year: number, sequence: number): string {
  return `ORD-${year}-${String(sequence).padStart(6, '0')}`;
}
