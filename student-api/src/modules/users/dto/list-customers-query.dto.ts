import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { ToBoolean, Trim } from '../../../common/decorators/transforms';
import { PaginationQueryDto } from '../../../common/pagination/pagination.dto';

export class ListCustomersQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() @MaxLength(100) @Trim()
  search?: string;

  @IsOptional() @ToBoolean() @IsBoolean()
  isActive?: boolean;
}
