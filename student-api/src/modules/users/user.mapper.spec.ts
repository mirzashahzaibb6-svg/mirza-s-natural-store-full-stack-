import { Prisma, Role, type User } from '../../database/prisma';
import { toUserResponse } from './user.mapper';

describe('toUserResponse', () => {
  const user: User = {
    id: 'u1', name: 'Ali', email: 'ali@example.com', passwordHash: 'SECRET-HASH', role: Role.CUSTOMER, isActive: true,
    totalOrders: 2, totalSpent: new Prisma.Decimal('19.5'), createdAt: new Date('2026-01-01T00:00:00Z'), updatedAt: new Date(),
  };
  it('never exposes passwordHash and formats money as a string', () => {
    const out = toUserResponse(user);
    expect(JSON.stringify(out)).not.toContain('SECRET-HASH');
    expect(out).not.toHaveProperty('passwordHash');
    expect(out.totalSpent).toBe('19.50');
  });
});
