import type { Role } from '../../database/prisma';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  totalOrders: number;
  totalSpent: string;
  createdAt: string;
}
