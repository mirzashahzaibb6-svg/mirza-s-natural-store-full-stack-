import type { User } from '../../database/prisma';
import { formatMoney } from '../../shared/money/format';
import type { UserResponse } from './types';

/** Explicit field list: passwordHash can never leak because it is never copied. */
export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    totalOrders: user.totalOrders,
    totalSpent: formatMoney(user.totalSpent),
    createdAt: user.createdAt.toISOString(),
  };
}
