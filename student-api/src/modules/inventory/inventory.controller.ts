import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Paginated } from '../../common/types';
import { Role } from '../../database/prisma';
import { UuidParamDto } from '../users/dto/customer-id-param.dto';
import { AdjustInventoryDto, CreateInventoryDto, ListInventoryQueryDto, TransactionsQueryDto } from './dto/inventory.dto';
import { InventoryService } from './inventory.service';
import type { InventoryResponse, InventoryTransactionResponse } from './types';

@ApiTags('admin / inventory')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  list(@Query() q: ListInventoryQueryDto): Promise<Paginated<InventoryResponse>> {
    return this.inventory.list(q);
  }

  @Post()
  create(@Body() dto: CreateInventoryDto): Promise<InventoryResponse> {
    return this.inventory.create(dto);
  }

  // Static route before ":id/transactions".
  @HttpCode(200)
  @Post('adjustments')
  adjust(@Body() dto: AdjustInventoryDto): Promise<InventoryResponse> {
    return this.inventory.adjust(dto);
  }

  @Get(':id/transactions')
  transactions(@Param() p: UuidParamDto, @Query() q: TransactionsQueryDto): Promise<Paginated<InventoryTransactionResponse>> {
    return this.inventory.transactions(p.id, q);
  }
}
