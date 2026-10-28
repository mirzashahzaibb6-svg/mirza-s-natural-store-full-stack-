import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types';
import { Role } from '../../database/prisma';
import { UuidParamDto } from '../users/dto/customer-id-param.dto';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import type { AddressResponse } from './types';

@ApiTags('addresses')
@ApiBearerAuth()
@Roles(Role.CUSTOMER)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<AddressResponse[]> {
    return this.addresses.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAddressDto): Promise<AddressResponse> {
    return this.addresses.create(user.id, dto);
  }

  // Static route before the generic :id route.
  @Patch(':id/default')
  setDefault(@CurrentUser() user: AuthUser, @Param() p: UuidParamDto): Promise<AddressResponse> {
    return this.addresses.setDefault(user.id, p.id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param() p: UuidParamDto, @Body() dto: UpdateAddressDto): Promise<AddressResponse> {
    return this.addresses.update(user.id, p.id, dto);
  }

  @HttpCode(204)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param() p: UuidParamDto): Promise<void> {
    return this.addresses.remove(user.id, p.id);
  }
}
