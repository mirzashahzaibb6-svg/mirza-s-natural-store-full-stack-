import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma 7: connection URL lives here (not in schema.prisma) and .env must be loaded explicitly.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
