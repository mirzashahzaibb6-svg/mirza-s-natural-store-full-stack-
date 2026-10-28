import { validateEnv } from './env.validation';

const good = {
  DATABASE_URL: 'postgresql://x', JWT_SECRET: 'a'.repeat(32), PAYMENT_WEBHOOK_SECRET: 'b'.repeat(16), FRONTEND_ORIGIN: 'http://localhost:3000',
};

describe('validateEnv', () => {
  it('accepts a valid environment and applies defaults', () => {
    const env = validateEnv(good);
    expect(env.PORT).toBe(4000);
    expect(env.SHIPPING_COST).toBe('0');
  });
  it('fails fast on a short JWT secret', () => {
    expect(() => validateEnv({ ...good, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
  });
  it('fails fast on missing database url', () => {
    expect(() => validateEnv({ ...good, DATABASE_URL: '' })).toThrow(/DATABASE_URL/);
  });
});
