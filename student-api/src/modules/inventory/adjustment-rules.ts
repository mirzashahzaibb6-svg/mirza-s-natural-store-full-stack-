import { InventoryMovementType } from '../../database/prisma';

/** Documented adjustment reasons (validated by the DTO). */
export const ADJUSTMENT_REASONS = [
  'RECEIVED_STOCK', // must be positive
  'FOUND_STOCK', // positive or negative
  'COUNT_CORRECTION', // positive or negative
  'DAMAGE', // must be negative
  'RETURN_TO_SUPPLIER', // must be negative
  'OTHER',
] as const;
export type AdjustmentReason = (typeof ADJUSTMENT_REASONS)[number];

const MUST_BE_NEGATIVE: AdjustmentReason[] = ['DAMAGE', 'RETURN_TO_SUPPLIER'];
const MUST_BE_POSITIVE: AdjustmentReason[] = ['RECEIVED_STOCK'];

/** Returns an error message, or null when the quantity direction is valid for the reason. */
export function validateAdjustmentDirection(reason: AdjustmentReason, quantity: number): string | null {
  if (quantity === 0) return 'Quantity must not be zero';
  if (MUST_BE_NEGATIVE.includes(reason) && quantity > 0) return `${reason} adjustments must be negative`;
  if (MUST_BE_POSITIVE.includes(reason) && quantity < 0) return `${reason} adjustments must be positive`;
  return null;
}

export function movementTypeFor(reason: AdjustmentReason, quantity: number): InventoryMovementType {
  if (quantity < 0) return InventoryMovementType.ADJUSTMENT_DECREASE;
  return reason === 'RECEIVED_STOCK' ? InventoryMovementType.RECEIVED : InventoryMovementType.ADJUSTMENT_INCREASE;
}
