import { Type } from 'class-transformer';
import {
  IsDateString, IsEnum, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateIf, ValidateNested,
} from 'class-validator';
import { Trim } from '../../../common/decorators/transforms';
import { PaginationQueryDto } from '../../../common/pagination/pagination.dto';
import { DeliveryType, OrderStatus, PaymentStatus } from '../../../database/prisma';

export class ShippingAddressDto {
  @IsString() @MinLength(2) @MaxLength(100) @Trim() addressLine!: string;
  @IsString() @MinLength(2) @MaxLength(30) @Trim() city!: string;
  @IsString() @MinLength(2) @MaxLength(30) @Trim() county!: string;
  @IsString() @MinLength(2) @MaxLength(20) @Trim() postcode!: string;
}

export class CreateOrderDto {
  @IsEnum(DeliveryType) deliveryType!: DeliveryType;
  @IsOptional() @IsUUID() addressId?: string;
  @IsOptional() @ValidateNested() @Type(() => ShippingAddressDto) shippingAddress?: ShippingAddressDto;
  @IsOptional() @IsDateString() pickupScheduledAt?: string;
  @IsOptional() @IsString() @MaxLength(500) @Trim() customerNotes?: string;
}

export const CUSTOMER_CANCEL_REASONS = ['CHANGED_MIND', 'ORDERED_BY_MISTAKE', 'FOUND_BETTER_PRICE', 'DELIVERY_TOO_LONG', 'OTHER'] as const;
export const ADMIN_CANCEL_REASONS = ['CUSTOMER_REQUEST', 'OUT_OF_STOCK', 'PAYMENT_ISSUE', 'OTHER'] as const;

export class CustomerCancelDto {
  @IsIn(CUSTOMER_CANCEL_REASONS as unknown as string[]) reason!: (typeof CUSTOMER_CANCEL_REASONS)[number];
  @ValidateIf((o: CustomerCancelDto) => o.reason === 'OTHER' || o.note !== undefined)
  @IsString() @MinLength(3) @MaxLength(500) @Trim()
  note?: string;
}

export class AdminCancelDto {
  @IsIn(ADMIN_CANCEL_REASONS as unknown as string[]) reason!: (typeof ADMIN_CANCEL_REASONS)[number];
  @ValidateIf((o: AdminCancelDto) => o.reason === 'OTHER' || o.note !== undefined)
  @IsString() @MinLength(3) @MaxLength(500) @Trim()
  note?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus) status!: OrderStatus;
}

export class ListMyOrdersQueryDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(OrderStatus) status?: OrderStatus;
}

export class AdminListOrdersQueryDto extends ListMyOrdersQueryDto {
  @IsOptional() @IsEnum(PaymentStatus) paymentStatus?: PaymentStatus;
  @IsOptional() @IsString() @MaxLength(100) @Trim() search?: string;
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
}
