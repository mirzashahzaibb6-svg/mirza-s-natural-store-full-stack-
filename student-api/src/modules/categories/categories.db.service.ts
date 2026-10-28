import { ConflictException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { TX_OPTIONS } from '../../database/database.types';
import { isUniqueViolation } from '../../database/db-errors';
import type { Category, Prisma } from '../../database/prisma';
import { toSkip } from '../../common/pagination/pagination';

export type CategoryWithCounts = Category & { _count: { children: number; products: number } };

@Injectable()
export class CategoriesDbService {
  constructor(private readonly db: DatabaseService) {}

  findById(id: string): Promise<CategoryWithCounts | null> {
    return this.db.category.findUnique({ where: { id }, include: { _count: { select: { children: true, products: true } } } });
  }

  async list(where: Prisma.CategoryWhereInput, page: number, limit: number): Promise<{ rows: Category[]; total: number }> {
    const [total, rows] = await this.db.$transaction([
      this.db.category.count({ where }),
      this.db.category.findMany({ where, orderBy: [{ depth: 'asc' }, { name: 'asc' }], skip: toSkip(page, limit), take: limit }),
    ]);
    return { rows, total };
  }

  async create(data: { id: string; name: string; slug: string; parentId: string | null; depth: number; path: string; isActive: boolean }): Promise<Category> {
    try {
      return await this.db.category.create({ data });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('A category with this name or slug already exists');
      throw error;
    }
  }

  /** Updates the category and rewrites descendant path/depth in the same transaction. */
  async update(id: string, data: Prisma.CategoryUncheckedUpdateInput, path: string, depth: number): Promise<Category> {
    try {
      return await this.db.$transaction(async (tx) => {
        const updated = await tx.category.update({ where: { id }, data: { ...data, path, depth } });
        const children = await tx.category.findMany({ where: { parentId: id } });
        for (const child of children) {
          await tx.category.update({ where: { id: child.id }, data: { path: `${path}/${child.id}`, depth: depth + 1 } });
        }
        return updated;
      }, TX_OPTIONS);
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('A category with this name or slug already exists');
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.db.category.delete({ where: { id } });
  }
}
