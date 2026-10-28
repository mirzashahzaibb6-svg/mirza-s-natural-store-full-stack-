import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';
import { ToBoolean, Trim } from '../../../common/decorators/transforms';
import { PaginationQueryDto } from '../../../common/pagination/pagination.dto';

export class CreateProductDto {
  @IsString() @MinLength(2) @MaxLength(120) @Trim() name!: string;
  @IsOptional() @IsString() @MaxLength(2000) @Trim() description?: string;
  @IsUUID() categoryId!: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) price!: number;
  @IsOptional() @IsInt() @Min(1) minimumOrderQuantity?: number;
  @IsOptional() @IsInt() @Min(1) maximumOrderQuantity?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export const PRODUCT_SORTS = ['newest', 'price_asc', 'price_desc', 'name_asc'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export class ListProductsQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() @MaxLength(100) @Trim() q?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) minPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) maxPrice?: number;
  @IsOptional() @IsEnum(PRODUCT_SORTS) sort: ProductSort = 'newest';
}

export class AdminListProductsQueryDto extends ListProductsQueryDto {
  @IsOptional() @ToBoolean() @IsBoolean() isActive?: boolean;
}
