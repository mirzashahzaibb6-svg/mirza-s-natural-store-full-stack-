import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { paginated } from '../../common/pagination/pagination';
import { slugify } from '../../common/slug';
import type { Paginated } from '../../common/types';
import { Prisma } from '../../database/prisma';
import { AdminListProductsQueryDto, CreateProductDto, ListProductsQueryDto, ProductSort, UpdateProductDto } from './dto/product.dto';
import { toProductResponse } from './product.mapper';
import { ProductsDbService } from './products.db.service';
import type { ProductResponse } from './types';

const SORTS: Record<ProductSort, Prisma.ProductOrderByWithRelationInput[]> = {
  newest: [{ createdAt: 'desc' }],
  price_asc: [{ price: 'asc' }, { name: 'asc' }],
  price_desc: [{ price: 'desc' }, { name: 'asc' }],
  name_asc: [{ name: 'asc' }],
};

@Injectable()
export class ProductsService {
  constructor(private readonly productsDb: ProductsDbService) {}

  listPublic(q: ListProductsQueryDto): Promise<Paginated<ProductResponse>> {
    return this.list({ isActive: true, category: { isActive: true }, ...this.filters(q) }, q);
  }

  listAdmin(q: AdminListProductsQueryDto): Promise<Paginated<ProductResponse>> {
    return this.list({ ...(q.isActive !== undefined ? { isActive: q.isActive } : {}), ...this.filters(q) }, q);
  }

  async getPublic(id: string): Promise<ProductResponse> {
    const product = await this.productsDb.findById(id);
    if (!product || !product.isActive) throw new NotFoundException('Product not found');
    return toProductResponse(product);
  }

  async create(dto: CreateProductDto): Promise<ProductResponse> {
    const min = dto.minimumOrderQuantity ?? 1;
    const max = dto.maximumOrderQuantity ?? 20;
    if (max < min) throw new BadRequestException('maximumOrderQuantity must be greater than or equal to minimumOrderQuantity');
    await this.assertCategoryUsable(dto.categoryId);
    const n = await this.productsDb.nextSkuNumber();
    const created = await this.productsDb.create({
      name: dto.name, description: dto.description ?? null, categoryId: dto.categoryId,
      price: new Prisma.Decimal(dto.price.toFixed(2)), minimumOrderQuantity: min, maximumOrderQuantity: max,
      isActive: dto.isActive ?? true, sku: `SKU-${String(n).padStart(6, '0')}`, slug: `${slugify(dto.name)}-${n}`,
    });
    return toProductResponse(created);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponse> {
    const current = await this.productsDb.findById(id);
    if (!current) throw new NotFoundException('Product not found');
    const min = dto.minimumOrderQuantity ?? current.minimumOrderQuantity;
    const max = dto.maximumOrderQuantity ?? current.maximumOrderQuantity;
    if (max < min) throw new BadRequestException('maximumOrderQuantity must be greater than or equal to minimumOrderQuantity');
    if (dto.categoryId && dto.categoryId !== current.categoryId) await this.assertCategoryUsable(dto.categoryId);

    const data: Prisma.ProductUncheckedUpdateInput = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
      ...(dto.price !== undefined ? { price: new Prisma.Decimal(dto.price.toFixed(2)) } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      minimumOrderQuantity: min,
      maximumOrderQuantity: max,
    };
    return toProductResponse(await this.productsDb.update(id, data));
  }

  private async assertCategoryUsable(categoryId: string): Promise<void> {
    const category = await this.productsDb.findCategoryForProduct(categoryId);
    if (!category) throw new BadRequestException('Category not found');
    if (!category.isActive) throw new BadRequestException('Category is not active');
    if (category._count.children > 0) throw new BadRequestException('Products can only be placed in a leaf category');
  }

  private filters(q: ListProductsQueryDto): Prisma.ProductWhereInput {
    const price: Prisma.DecimalFilter = {};
    if (q.minPrice !== undefined) price.gte = new Prisma.Decimal(q.minPrice.toFixed(2));
    if (q.maxPrice !== undefined) price.lte = new Prisma.Decimal(q.maxPrice.toFixed(2));
    return {
      ...(q.categoryId ? { categoryId: q.categoryId } : {}),
      ...(q.q ? { OR: [{ name: { contains: q.q, mode: 'insensitive' as const } }, { description: { contains: q.q, mode: 'insensitive' as const } }] } : {}),
      ...(Object.keys(price).length ? { price } : {}),
    };
  }

  private async list(where: Prisma.ProductWhereInput, q: ListProductsQueryDto): Promise<Paginated<ProductResponse>> {
    const { rows, total } = await this.productsDb.list(where, SORTS[q.sort], q.page, q.limit);
    return paginated(rows.map(toProductResponse), total, q.page, q.limit);
  }
}
