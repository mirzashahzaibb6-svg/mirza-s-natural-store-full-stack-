import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types';
import { Role } from '../../database/prisma';
import { UuidParamDto } from '../users/dto/customer-id-param.dto';
import { CartService } from './cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';
import type { CartResponse } from './types';

@ApiTags('cart')
@ApiBearerAuth()
@Roles(Role.CUSTOMER)
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  get(@CurrentUser() user: AuthUser): Promise<CartResponse> {
    return this.cart.get(user.id);
  }

  @Post('items')
  add(@CurrentUser() user: AuthUser, @Body() dto: AddCartItemDto): Promise<CartResponse> {
    return this.cart.addItem(user.id, dto);
  }

  @Patch('items/:id')
  update(@CurrentUser() user: AuthUser, @Param() p: UuidParamDto, @Body() dto: UpdateCartItemDto): Promise<CartResponse> {
    return this.cart.updateItem(user.id, p.id, dto);
  }

  @HttpCode(204)
  @Delete('items/:id')
  remove(@CurrentUser() user: AuthUser, @Param() p: UuidParamDto): Promise<void> {
    return this.cart.removeItem(user.id, p.id);
  }

  @HttpCode(204)
  @Delete()
  clear(@CurrentUser() user: AuthUser): Promise<void> {
    return this.cart.clear(user.id);
  }
}
