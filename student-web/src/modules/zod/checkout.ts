import { z } from 'zod';
import type { CreateOrderInput } from '@/services/orders/types';

/** "new" => the inline address fields are required; otherwise a saved addressId must be chosen. */
export const checkoutSchema = z
  .object({
    deliveryType: z.enum(['DELIVERY', 'PICKUP']),
    addressId: z.string().optional(),
    addressLine: z.string().trim().max(100).optional(),
    city: z.string().trim().max(30).optional(),
    county: z.string().trim().max(30).optional(),
    postcode: z.string().trim().max(20).optional(),
    pickupScheduledAt: z.string().optional(),
    customerNotes: z.string().trim().max(500, 'Notes can be at most 500 characters').optional(),
  })
  .superRefine((v, ctx) => {
    if (v.deliveryType === 'DELIVERY') {
      if (v.addressId && v.addressId !== 'new') return;
      for (const field of ['addressLine', 'city', 'county', 'postcode'] as const) {
        if (!v[field] || v[field]!.length < 2) ctx.addIssue({ code: 'custom', path: [field], message: 'This field is required' });
      }
      return;
    }
    if (!v.pickupScheduledAt) {
      ctx.addIssue({ code: 'custom', path: ['pickupScheduledAt'], message: 'Choose a pickup date and time' });
    } else if (new Date(v.pickupScheduledAt).getTime() <= Date.now()) {
      ctx.addIssue({ code: 'custom', path: ['pickupScheduledAt'], message: 'Pickup time must be in the future' });
    }
  });
export type CheckoutValues = z.infer<typeof checkoutSchema>;

/** Converts form values to the API body (exactly one address source for DELIVERY, none for PICKUP). */
export function toOrderInput(v: CheckoutValues): CreateOrderInput {
  const notes = v.customerNotes ? { customerNotes: v.customerNotes } : {};
  if (v.deliveryType === 'PICKUP') {
    return { deliveryType: 'PICKUP', pickupScheduledAt: new Date(v.pickupScheduledAt as string).toISOString(), ...notes };
  }
  if (v.addressId && v.addressId !== 'new') return { deliveryType: 'DELIVERY', addressId: v.addressId, ...notes };
  return {
    deliveryType: 'DELIVERY',
    shippingAddress: { addressLine: v.addressLine!, city: v.city!, county: v.county!, postcode: v.postcode! },
    ...notes,
  };
}
