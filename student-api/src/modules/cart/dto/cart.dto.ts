import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class AddCartItemDto {
  @IsUUID() productId!: string;
  @IsInt() @Min(1) @Max(1000) quantity!: number;
}

/** quantity 0 removes the item. */
export class UpdateCartItemDto {
  @IsInt() @Min(0) @Max(1000) quantity!: number;
}
