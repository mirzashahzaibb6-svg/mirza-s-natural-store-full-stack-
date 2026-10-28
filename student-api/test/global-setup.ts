import { execSync } from 'node:child_process';
import * as dotenv from 'dotenv';
import { join } from 'node:path';

export default function globalSetup(): void {
  dotenv.config({ path: join(__dirname, '..', '.env.test'), override: true });
  const url = process.env.DATABASE_URL ?? '';
  // Safety: never run destructive e2e cleanup against a non-test database.
  if (!/_test(\?|$)/.test(url)) throw new Error('Refusing to run e2e tests: DATABASE_URL must point to a database whose name ends with "_test"');
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env, cwd: join(__dirname, '..') });
}
