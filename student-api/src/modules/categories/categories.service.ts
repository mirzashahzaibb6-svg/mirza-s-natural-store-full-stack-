import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { paginated } from '../../common/pagination/pagination';
import { slugify } from '../../common/slug';
import type { Paginated } from '../../common/types';
import type { Prisma } from '../../database/prisma';
import { toCategoryResponse } from './category.mapper';
import { CategoriesDbService, type CategoryWithCounts } from './categories.db.service';
import { AdminListCategoriesQueryDto, CreateCategoryDto, ListCategoriesQueryDto, UpdateCategoryDto } from './dto/category.dto';
import type { CategoryResponse } from './types';

/** Student target: two levels only (root depth 0, child depth 1). See notes/decisions.md D-02. */
const MAX_DEPTH = 1;

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesDb: CategoriesDbService) {}

  async listPublic(q: ListCategoriesQueryDto): Promise<Paginated<CategoryResponse>> {
    return this.list({ isActive: true, ...this.filters(q) }, q);
  }

  async listAdmin(q: AdminListCategoriesQueryDto): Promise<Paginated<CategoryResponse>> {
    return this.list({ ...(q.isActive !== undefined ? { isActive: q.isActive } : {}), ...this.filters(q) }, q);
  }

  async create(dto: CreateCategoryDto): Promise<CategoryResponse> {
    const id = randomUUID();
    let depth = 0;
    let path = `/${id}`;
    if (dto.parentId) {
      const parent = await this.requireCategory(dto.parentId, 'Parent category not found');
      this.assertCanBeParent(parent);
      depth = parent.depth + 1;
      path = `${parent.path}/${id}`;
    }
    const created = await this.categoriesDb.create({
      id, name: dto.name, slug: slugify(dto.name), parentId: dto.parentId ?? null, depth, path, isActive: dto.isActive ?? true,
    });
    return toCategoryResponse(created);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponse> {
    const current = await this.requireCategory(id, 'Category not found');
    const data: Prisma.CategoryUncheckedUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
      data.slug = slugify(dto.name);
    }
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    let path = current.path;
    let depth = current.depth;
    const parentChange = dto.parentId !== undefined && dto.parentId !== current.parentId;
    if (parentChange) {
      if (dto.parentId === null) {
        depth = 0;
        path = `/${id}`;
        data.parentId = null;
      } else {
        const newParentId = dto.parentId as string;
        if (newParentId === id) throw new BadRequestException('A category cannot be its own parent');
        const parent = await this.requireCategory(newParentId, 'Parent category not found');
        if (parent.path.split('/').includes(id)) throw new BadRequestException('A category cannot be moved under its own descendant');
        this.assertCanBeParent(parent);
        if (current._count.children > 0) throw new BadRequestException('A category that has children cannot become a child (max depth is 2 levels)');
        depth = parent.depth + 1;
        path = `${parent.path}/${id}`;
        data.parentId = newParentId;
      }
    }
    return toCategoryResponse(await this.categoriesDb.update(id, data, path, depth));
  }

  async remove(id: string): Promise<void> {
    const category = await this.requireCategory(id, 'Category not found');
    if (category._count.children > 0) throw new ConflictException('Category has child categories');
    if (category._count.products > 0) throw new ConflictException('Category has products');
    await this.categoriesDb.remove(id);
  }

  private assertCanBeParent(parent: CategoryWithCounts): void {
    if (parent.depth >= MAX_DEPTH) throw new BadRequestException('Maximum category depth reached (2 levels)');
    if (parent._count.products > 0) throw new ConflictException('A category that contains products cannot have child categories');
  }

  private async requireCategory(id: string, message: string): Promise<CategoryWithCounts> {
    const found = await this.categoriesDb.findById(id);
    if (!found) throw new NotFoundException(message);
    return found;
  }

  private filters(q: ListCategoriesQueryDto): Prisma.CategoryWhereInput {
    return {
      ...(q.q ? { name: { contains: q.q, mode: 'insensitive' as const } } : {}),
      ...(q.parentId ? { parentId: q.parentId } : {}),
    };
  }

  private async list(where: Prisma.CategoryWhereInput, q: ListCategoriesQueryDto): Promise<Paginated<CategoryResponse>> {
    const { rows, total } = await this.categoriesDb.list(where, q.page, q.limit);
    return paginated(rows.map(toCategoryResponse), total, q.page, q.limit);
  }
}
