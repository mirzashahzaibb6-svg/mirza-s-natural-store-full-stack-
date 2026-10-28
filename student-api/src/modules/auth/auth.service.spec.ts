import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Prisma, Role, type User } from '../../database/prisma';
import { UsersDbService } from '../users/users.db.service';
import { AuthService, INVALID_CREDENTIALS } from './auth.service';

function makeUser(over: Partial<User> = {}): User {
  return {
    id: 'u1', name: 'Ali', email: 'ali@example.com', passwordHash: bcrypt.hashSync('Password123', 4), role: Role.CUSTOMER,
    isActive: true, totalOrders: 0, totalSpent: new Prisma.Decimal(0), createdAt: new Date(), updatedAt: new Date(), ...over,
  };
}

describe('AuthService', () => {
  const jwt = { signAsync: jest.fn().mockResolvedValue('token') } as unknown as JwtService;
  const build = (users: Partial<UsersDbService>) => new AuthService(users as UsersDbService, jwt);

  it('login: wrong password and unknown email give the SAME message', async () => {
    const wrong = build({ findByEmail: jest.fn().mockResolvedValue(makeUser()) });
    const unknown = build({ findByEmail: jest.fn().mockResolvedValue(null) });
    const a = await wrong.login({ email: 'ali@example.com', password: 'WrongPass123' }).catch((e: Error) => e);
    const b = await unknown.login({ email: 'nobody@example.com', password: 'WrongPass123' }).catch((e: Error) => e);
    expect(a).toBeInstanceOf(UnauthorizedException);
    expect(b).toBeInstanceOf(UnauthorizedException);
    expect((a as Error).message).toBe(INVALID_CREDENTIALS);
    expect((b as Error).message).toBe(INVALID_CREDENTIALS);
  });

  it('login: deactivated account is 403 (after the password check)', async () => {
    const svc = build({ findByEmail: jest.fn().mockResolvedValue(makeUser({ isActive: false })) });
    await expect(svc.login({ email: 'ali@example.com', password: 'Password123' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('login: success returns a token and no password hash', async () => {
    const svc = build({ findByEmail: jest.fn().mockResolvedValue(makeUser()) });
    const res = await svc.login({ email: 'ali@example.com', password: 'Password123' });
    expect(res.accessToken).toBe('token');
    expect(JSON.stringify(res)).not.toContain('passwordHash');
  });

  it('register: only creates CUSTOMERs with a bcrypt hash', async () => {
    const createCustomer = jest.fn().mockImplementation((d: { passwordHash: string }) => Promise.resolve(makeUser({ passwordHash: d.passwordHash })));
    const svc = build({ createCustomer });
    await svc.register({ name: 'Ali', email: 'ali@example.com', password: 'Password123' });
    const arg = createCustomer.mock.calls[0][0] as { passwordHash: string };
    expect(arg.passwordHash).not.toBe('Password123');
    expect(arg.passwordHash.startsWith('$2')).toBe(true);
    expect(arg).not.toHaveProperty('role');
  });
});
