import { ConflictException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { isUniqueViolation } from '../../database/db-errors';
import { Prisma, Role, type User } from '../../database/prisma';
import { toSkip } from '../../common/pagination/pagination';

@Injectable()
export class UsersDbService {
  constructor(private readonly db: DatabaseService) {}

  findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { email } });
  }

  /** Public registration only ever creates CUSTOMER. */
  async createCustomer(data: { name: string; email: string; passwordHash: string }): Promise<User> {
    try {
      return await this.db.user.create({ data: { ...data, role: Role.CUSTOMER } });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('Email is already registered');
      throw error;
    }
  }

  async listCustomers(query: { page: number; limit: number; search?: string; isActive?: boolean }): Promise<{ rows: User[]; total: number }> {
    const where: Prisma.UserWhereInput = {
      role: Role.CUSTOMER,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { email: { contains: query.search, mode: 'insensitive' } }] }
        : {}),
    };
    const [total, rows] = await this.db.$transaction([
      this.db.user.count({ where }),
      this.db.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip: toSkip(query.page, query.limit), take: query.limit }),
    ]);
    return { rows, total };
  }

  /** Only customers can be targeted; returns null when no such customer exists. */
  async setCustomerActive(id: string, isActive: boolean): Promise<User | null> {
    const result = await this.db.user.updateMany({ where: { id, role: Role.CUSTOMER }, data: { isActive } });
    if (result.count === 0) return null;
    return this.db.user.findUnique({ where: { id } });
  }
}
