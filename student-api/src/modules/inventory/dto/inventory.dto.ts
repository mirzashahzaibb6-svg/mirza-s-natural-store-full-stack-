import { IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, NotEquals } from 'class-validator';
import { Trim } from '../../../common/decorators/transforms';
import { PaginationQueryDto } from '../../../common/pagination/pagination.dto';
import { StockStatus } from '../../../database/prisma';
import { ADJUSTMENT_REASONS, type AdjustmentReason } from '../adjustment-rules';

export class CreateInventoryDto {
  @IsUUID() productId!: string;
  @IsInt() @Min(0) qtyOnHand!: number;
  @IsOptional() @IsInt() @Min(0) lowStockThreshold?: number;
}

export class AdjustInventoryDto {
  @IsUUID() inventoryId!: string;
  @IsInt() @NotEquals(0) quantity!: number;
  @IsIn(ADJUSTMENT_REASONS as unknown as string[]) reason!: AdjustmentReason;
  @IsOptional() @IsString() @MaxLength(500) @Trim() note?: string;
}

export class ListInventoryQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() @MaxLength(100) @Trim() search?: string;
  @IsOptional() @IsEnum(StockStatus) stockStatus?: StockStatus;
}

export class TransactionsQueryDto extends PaginationQueryDto {}
