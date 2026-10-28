import { z } from 'zod';
import { ADJUSTMENT_REASONS } from '@/services/admin/types';

const num = (msg: string) => z.number({ error: msg });

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  parentId: z.string().optional(),
  isActive: z.boolean(),
});
export type CategoryValues = z.infer<typeof categorySchema>;

export const productSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
    description: z.string().trim().max(2000).optional(),
    categoryId: z.string().min(1, 'Choose a category'),
    price: num('Enter a valid price').min(0.01, 'Price must be at least 0.01'),
    minimumOrderQuantity: num('Enter a number').int().min(1, 'Minimum is 1'),
    maximumOrderQuantity: num('Enter a number').int().min(1, 'Minimum is 1'),
    isActive: z.boolean(),
  })
  .refine((v) => v.maximumOrderQuantity >= v.minimumOrderQuantity, { path: ['maximumOrderQuantity'], message: 'Must be at least the minimum quantity' });
export type ProductValues = z.infer<typeof productSchema>;

export const inventoryCreateSchema = z.object({
  productId: z.string().min(1, 'Choose a product'),
  qtyOnHand: num('Enter a number').int().min(0),
  lowStockThreshold: num('Enter a number').int().min(0),
});
export type InventoryCreateValues = z.infer<typeof inventoryCreateSchema>;

const MUST_BE_NEGATIVE = ['DAMAGE', 'RETURN_TO_SUPPLIER'];
export const adjustSchema = z
  .object({
    quantity: num('Enter a number').int().refine((n) => n !== 0, 'Quantity cannot be zero'),
    reason: z.enum(ADJUSTMENT_REASONS),
    note: z.string().trim().max(500).optional(),
  })
  .superRefine((v, ctx) => {
    if (MUST_BE_NEGATIVE.includes(v.reason) && v.quantity > 0) ctx.addIssue({ code: 'custom', path: ['quantity'], message: `${v.reason} must be a negative number` });
    if (v.reason === 'RECEIVED_STOCK' && v.quantity < 0) ctx.addIssue({ code: 'custom', path: ['quantity'], message: 'RECEIVED_STOCK must be a positive number' });
  });
export type AdjustValues = z.infer<typeof adjustSchema>;

/** Used by both customer and admin cancel dialogs. OTHER requires a note. */
export const cancelSchema = z
  .object({ reason: z.string().min(1, 'Choose a reason'), note: z.string().trim().max(500).optional() })
  .refine((v) => v.reason !== 'OTHER' || (v.note?.length ?? 0) >= 3, { path: ['note'], message: 'Please add a short note (min 3 characters)' });
export type CancelValues = z.infer<typeof cancelSchema>;
