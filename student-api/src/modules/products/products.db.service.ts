import { ConflictException, Injectable } from '@nestjs/common';
import { toSkip } from '../../common/pagination/pagination';
import { DatabaseService } from '../../database/database.service';
import { isUniqueViolation } from '../../database/db-errors';
import { Prisma } from '../../database/prisma';
import type { ProductWithRelations } from './product.mapper';

const INCLUDE = {
  category: { select: { id: true, name: true, slug: true } },
  inventory: { select: { status: true } },
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsDbService {
  constructor(private readonly db: DatabaseService) {}

  findById(id: string): Promise<ProductWithRelations | null> {
    return this.db.product.findUnique({ where: { id }, include: INCLUDE });
  }

  async list(where: Prisma.ProductWhereInput, orderBy: Prisma.ProductOrderByWithRelationInput[], page: number, limit: number): Promise<{ rows: ProductWithRelations[]; total: number }> {
    const [total, rows] = await this.db.$transaction([
      this.db.product.count({ where }),
      this.db.product.findMany({ where, orderBy, include: INCLUDE, skip: toSkip(page, limit), take: limit }),
    ]);
    return { rows, total };
  }

  /** SKU comes from a DB sequence, never MAX()+1 (safe under concurrency). */
  async nextSkuNumber(): Promise<number> {
    const rows = await this.db.$queryRaw<{ n: bigint }[]>`SELECT nextval('product_sku_seq') AS n`;
    return Number(rows[0].n);
  }

  async create(data: Prisma.ProductUncheckedCreateInput): Promise<ProductWithRelations> {
    try {
      return await this.db.product.create({ data, include: INCLUDE });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('A product with this name already exists in the category');
      throw error;
    }
  }

  async update(id: string, data: Prisma.ProductUncheckedUpdateInput): Promise<ProductWithRelations> {
    try {
      return await this.db.product.update({ where: { id }, data, include: INCLUDE });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('A product with this name already exists in the category');
      throw error;
    }
  }

  /** A product may only live in an active leaf category. */
  findCategoryForProduct(categoryId: string): Promise<{ id: string; isActive: boolean; _count: { children: number } } | null> {
    return this.db.category.findUnique({ where: { id: categoryId }, select: { id: true, isActive: true, _count: { select: { children: true } } } });
  }
}
