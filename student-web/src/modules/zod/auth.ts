import { z } from 'zod';

const password = z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password must be at most 72 characters');
const email = z.string().trim().toLowerCase().email('Enter a valid email address');

export const loginSchema = z.object({ email, password });
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name').max(100),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });
export type RegisterValues = z.infer<typeof registerSchema>;
