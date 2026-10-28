import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { Trim } from '../../../common/decorators/transforms';

export class CreateAddressDto {
  @IsString() @MinLength(2) @MaxLength(100) @Trim() addressLine!: string;
  @IsString() @MinLength(2) @MaxLength(30) @Trim() city!: string;
  @IsString() @MinLength(2) @MaxLength(30) @Trim() county!: string;
  @IsString() @MinLength(2) @MaxLength(20) @Trim() postcode!: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

// Default is changed only through PATCH /addresses/:id/default (keeps the transaction in one place).
class AddressFieldsDto {
  @IsString() @MinLength(2) @MaxLength(100) @Trim() addressLine!: string;
  @IsString() @MinLength(2) @MaxLength(30) @Trim() city!: string;
  @IsString() @MinLength(2) @MaxLength(30) @Trim() county!: string;
  @IsString() @MinLength(2) @MaxLength(20) @Trim() postcode!: string;
}
export class UpdateAddressDto extends PartialType(AddressFieldsDto) {}
