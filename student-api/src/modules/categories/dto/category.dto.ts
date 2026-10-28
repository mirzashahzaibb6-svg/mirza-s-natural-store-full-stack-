import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ToBoolean, Trim } from '../../../common/decorators/transforms';
import { PaginationQueryDto } from '../../../common/pagination/pagination.dto';

export class CreateCategoryDto {
  @IsString() @MinLength(2) @MaxLength(60) @Trim()
  name!: string;

  @IsOptional() @IsUUID()
  parentId?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

/** parentId: null (explicit) moves a child up to the root level. */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class ListCategoriesQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() @MaxLength(60) @Trim()
  q?: string;

  @IsOptional() @IsUUID()
  parentId?: string;
}

export class AdminListCategoriesQueryDto extends ListCategoriesQueryDto {
  @IsOptional() @ToBoolean() @IsBoolean()
  isActive?: boolean;
}
