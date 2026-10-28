import type { Prisma } from './prisma';

export type Tx = Prisma.TransactionClient;
export const TX_OPTIONS = { maxWait: 5000, timeout: 20000 } as const;
