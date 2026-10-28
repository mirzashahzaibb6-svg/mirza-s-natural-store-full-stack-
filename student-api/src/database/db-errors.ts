import { Prisma } from './prisma';

export function hasPrismaCode(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

/** P2002 = unique constraint violation. */
export const isUniqueViolation = (error: unknown): boolean => hasPrismaCode(error, 'P2002');
