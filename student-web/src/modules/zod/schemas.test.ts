import { describe, expect, it } from 'vitest';
import { adjustSchema, cancelSchema, productSchema } from './admin';
import { loginSchema, registerSchema } from './auth';
import { checkoutSchema, toOrderInput } from './checkout';

const future = () => new Date(Date.now() + 3_600_000).toISOString().slice(0, 16);

describe('auth schemas', () => {
  it('normalises e-mail and enforces password length', () => {
    expect(loginSchema.parse({ email: '  Ali@Test.COM ', password: 'Password123' }).email).toBe('ali@test.com');
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'short' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x'.repeat(73) }).success).toBe(false);
  });
  it('register requires matching passwords', () => {
    const r = registerSchema.safeParse({ name: 'Ali', email: 'a@b.co', password: 'Password123', confirmPassword: 'Different123' });
    expect(r.success).toBe(false);
  });
});

describe('checkout schema', () => {
  it('DELIVERY with a saved address is valid and sends only addressId', () => {
    const v = checkoutSchema.parse({ deliveryType: 'DELIVERY', addressId: 'abc' });
    expect(toOrderInput(v)).toEqual({ deliveryType: 'DELIVERY', addressId: 'abc' });
  });
  it('DELIVERY with a new address needs all four fields', () => {
    expect(checkoutSchema.safeParse({ deliveryType: 'DELIVERY', addressId: 'new' }).success).toBe(false);
    const v = checkoutSchema.parse({ deliveryType: 'DELIVERY', addressId: 'new', addressLine: '1 Main St', city: 'City', county: 'Prov', postcode: '12345' });
    expect(toOrderInput(v).shippingAddress?.city).toBe('City');
    expect(toOrderInput(v).addressId).toBeUndefined();
  });
  it('PICKUP needs a future time and never sends an address', () => {
    expect(checkoutSchema.safeParse({ deliveryType: 'PICKUP' }).success).toBe(false);
    expect(checkoutSchema.safeParse({ deliveryType: 'PICKUP', pickupScheduledAt: '2000-01-01T10:00' }).success).toBe(false);
    const input = toOrderInput(checkoutSchema.parse({ deliveryType: 'PICKUP', addressId: 'new', pickupScheduledAt: future() }));
    expect(input.addressId).toBeUndefined();
    expect(input.shippingAddress).toBeUndefined();
    expect(input.pickupScheduledAt).toBeDefined();
  });
});

describe('admin schemas', () => {
  const base = { name: 'Honey', categoryId: 'c1', price: 10, minimumOrderQuantity: 2, maximumOrderQuantity: 5, isActive: true };
  it('product: max must not be below min, price at least 0.01', () => {
    expect(productSchema.safeParse(base).success).toBe(true);
    expect(productSchema.safeParse({ ...base, maximumOrderQuantity: 1 }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, price: 0 }).success).toBe(false);
  });
  it('stock adjustment direction rules', () => {
    expect(adjustSchema.safeParse({ quantity: 5, reason: 'DAMAGE' }).success).toBe(false);
    expect(adjustSchema.safeParse({ quantity: -5, reason: 'DAMAGE' }).success).toBe(true);
    expect(adjustSchema.safeParse({ quantity: -1, reason: 'RECEIVED_STOCK' }).success).toBe(false);
    expect(adjustSchema.safeParse({ quantity: 0, reason: 'OTHER' }).success).toBe(false);
  });
  it('cancel: OTHER requires a note', () => {
    expect(cancelSchema.safeParse({ reason: 'OTHER' }).success).toBe(false);
    expect(cancelSchema.safeParse({ reason: 'OTHER', note: 'because' }).success).toBe(true);
    expect(cancelSchema.safeParse({ reason: 'CHANGED_MIND' }).success).toBe(true);
  });
});
