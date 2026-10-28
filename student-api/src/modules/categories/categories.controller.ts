import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Paginated } from '../../common/types';
import { Role } from '../../database/prisma';
import { UuidParamDto } from '../users/dto/customer-id-param.dto';
import { CategoriesService } from './categories.service';
import { AdminListCategoriesQueryDto, CreateCategoryDto, ListCategoriesQueryDto, UpdateCategoryDto } from './dto/category.dto';
import type { CategoryResponse } from './types';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Public()
  @Get()
  list(@Query() q: ListCategoriesQueryDto): Promise<Paginated<CategoryResponse>> {
    return this.categories.listPublic(q);
  }
}

@ApiTags('admin / categories')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list(@Query() q: AdminListCategoriesQueryDto): Promise<Paginated<CategoryResponse>> {
    return this.categories.listAdmin(q);
  }

  @Post()
  create(@Body() dto: CreateCategoryDto): Promise<CategoryResponse> {
    return this.categories.create(dto);
  }

  @Patch(':id')
  update(@Param() p: UuidParamDto, @Body() dto: UpdateCategoryDto): Promise<CategoryResponse> {
    return this.categories.update(p.id, dto);
  }

  @HttpCode(204)
  @Delete(':id')
  remove(@Param() p: UuidParamDto): Promise<void> {
    return this.categories.remove(p.id);
  }
}
