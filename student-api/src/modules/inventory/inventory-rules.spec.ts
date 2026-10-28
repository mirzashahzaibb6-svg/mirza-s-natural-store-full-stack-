import { InventoryMovementType, StockStatus } from '../../database/prisma';
import { movementTypeFor, validateAdjustmentDirection } from './adjustment-rules';
import { computeStockStatus } from './stock-status';

describe('stock status', () => {
  it('maps quantity to status', () => {
    expect(computeStockStatus(0, 10)).toBe(StockStatus.OUT_OF_STOCK);
    expect(computeStockStatus(-3, 10)).toBe(StockStatus.OUT_OF_STOCK);
    expect(computeStockStatus(10, 10)).toBe(StockStatus.LOW_STOCK);
    expect(computeStockStatus(11, 10)).toBe(StockStatus.IN_STOCK);
  });
});

describe('adjustment rules', () => {
  it('rejects zero', () => expect(validateAdjustmentDirection('OTHER', 0)).not.toBeNull());
  it('DAMAGE and RETURN_TO_SUPPLIER must be negative', () => {
    expect(validateAdjustmentDirection('DAMAGE', 5)).not.toBeNull();
    expect(validateAdjustmentDirection('RETURN_TO_SUPPLIER', 1)).not.toBeNull();
    expect(validateAdjustmentDirection('DAMAGE', -5)).toBeNull();
  });
  it('RECEIVED_STOCK must be positive', () => {
    expect(validateAdjustmentDirection('RECEIVED_STOCK', -1)).not.toBeNull();
    expect(validateAdjustmentDirection('RECEIVED_STOCK', 4)).toBeNull();
  });
  it('maps movement type', () => {
    expect(movementTypeFor('RECEIVED_STOCK', 5)).toBe(InventoryMovementType.RECEIVED);
    expect(movementTypeFor('FOUND_STOCK', 5)).toBe(InventoryMovementType.ADJUSTMENT_INCREASE);
    expect(movementTypeFor('DAMAGE', -2)).toBe(InventoryMovementType.ADJUSTMENT_DECREASE);
  });
});
