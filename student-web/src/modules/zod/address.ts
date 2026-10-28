import { z } from 'zod';

export const addressSchema = z.object({
  addressLine: z.string().trim().min(2, 'Enter the street address').max(100),
  city: z.string().trim().min(2, 'Enter the city').max(30),
  county: z.string().trim().min(2, 'Enter the province / county').max(30),
  postcode: z.string().trim().min(2, 'Enter the postal code').max(20),
  isDefault: z.boolean().optional(),
});
export type AddressValues = z.infer<typeof addressSchema>;
