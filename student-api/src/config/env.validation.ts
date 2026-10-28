// Startup environment validation. The app refuses to boot if a required value is missing/weak.
export type RawEnv = Record<string, unknown>;

export function validateEnv(raw: RawEnv): RawEnv {
  const errors: string[] = [];
  const text = (key: string): string => (typeof raw[key] === 'string' ? (raw[key] as string).trim() : '');

  if (!text('DATABASE_URL')) errors.push('DATABASE_URL is required');
  if (text('JWT_SECRET').length < 32) errors.push('JWT_SECRET must be at least 32 characters');
  if (text('PAYMENT_WEBHOOK_SECRET').length < 16) errors.push('PAYMENT_WEBHOOK_SECRET must be at least 16 characters');
  if (!text('FRONTEND_ORIGIN')) errors.push('FRONTEND_ORIGIN is required (e.g. http://localhost:3000)');
  const shipping = text('SHIPPING_COST') || '0';
  if (!/^\d+(\.\d{1,2})?$/.test(shipping)) errors.push('SHIPPING_COST must be a non-negative number with up to 2 decimals');
  const port = Number(text('PORT') || '4000');
  if (!Number.isInteger(port) || port < 1 || port > 65535) errors.push('PORT must be a valid port number');

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n - ${errors.join('\n - ')}`);
  }
  return {
    ...raw,
    NODE_ENV: text('NODE_ENV') || 'development',
    PORT: port,
    JWT_EXPIRES_IN: text('JWT_EXPIRES_IN') || '1d',
    SHIPPING_COST: shipping,
    MOCK_REFUND_FAIL: text('MOCK_REFUND_FAIL') === 'true',
  };
}
