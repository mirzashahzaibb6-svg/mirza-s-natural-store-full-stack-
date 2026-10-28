import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Paginated } from '../../common/types';
import { Role } from '../../database/prisma';
import { UuidParamDto } from '../users/dto/customer-id-param.dto';
import { AdminListProductsQueryDto, CreateProductDto, ListProductsQueryDto, UpdateProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';
import type { ProductResponse } from './types';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Public()
  @Get()
  list(@Query() q: ListProductsQueryDto): Promise<Paginated<ProductResponse>> {
    return this.products.listPublic(q);
  }

  @Public()
  @Get(':id')
  get(@Param() p: UuidParamDto): Promise<ProductResponse> {
    return this.products.getPublic(p.id);
  }
}

@ApiTags('admin / products')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query() q: AdminListProductsQueryDto): Promise<Paginated<ProductResponse>> {
    return this.products.listAdmin(q);
  }

  @Post()
  create(@Body() dto: CreateProductDto): Promise<ProductResponse> {
    return this.products.create(dto);
  }

  @Patch(':id')
  update(@Param() p: UuidParamDto, @Body() dto: UpdateProductDto): Promise<ProductResponse> {
    return this.products.update(p.id, dto);
  }
}
