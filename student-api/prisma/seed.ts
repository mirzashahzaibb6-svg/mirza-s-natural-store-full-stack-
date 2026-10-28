import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '../src/generated/prisma/client';

// Creates the single ADMIN from environment variables. Safe to run repeatedly.
async function main(): Promise<void> {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!name || !email || !password) throw new Error('ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required');
  if (password.length < 8 || password.length > 72) throw new Error('ADMIN_PASSWORD must be 8-72 characters');

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const existing = await db.user.count({ where: { role: Role.ADMIN } });
    if (existing > 0) {
      console.log('Admin already exists - nothing to do.');
      return;
    }
    await db.user.create({
      data: { name, email, passwordHash: await bcrypt.hash(password, 12), role: Role.ADMIN },
    });
    console.log(`Admin created: ${email}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
