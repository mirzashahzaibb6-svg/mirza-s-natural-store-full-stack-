import { BadRequestException, Body, Controller, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { LIMIT_ORDER } from '../../common/constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser, Paginated } from '../../common/types';
import { CancelActor, Role } from '../../database/prisma';
import { UuidParamDto } from '../users/dto/customer-id-param.dto';
import { AdminCancelDto, AdminListOrdersQueryDto, CreateOrderDto, CustomerCancelDto, ListMyOrdersQueryDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrderCancelService } from './order-cancel.service';
import { OrderCreateService } from './order-create.service';
import { OrderQueryService } from './order-query.service';
import { OrderStatusService } from './order-status.service';
import type { OrderResponse } from './types/order.types';

const KEY_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

@ApiTags('orders')
@ApiBearerAuth()
@Roles(Role.CUSTOMER)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly creator: OrderCreateService,
    private readonly queries: OrderQueryService,
    private readonly canceller: OrderCancelService,
  ) {}

  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @Throttle(LIMIT_ORDER)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto, @Headers('idempotency-key') key?: string): Promise<OrderResponse> {
    if (!key || !KEY_PATTERN.test(key)) throw new BadRequestException('Idempotency-Key header is required (8-64 letters, digits, - or _)');
    return this.creator.create(user.id, dto, key);
  }

  @Get('me')
  listMine(@CurrentUser() user: AuthUser, @Query() q: ListMyOrdersQueryDto): Promise<Paginated<OrderResponse>> {
    return this.queries.listMine(user.id, q);
  }

  @Get('me/:id')
  getMine(@CurrentUser() user: AuthUser, @Param() p: UuidParamDto): Promise<OrderResponse> {
    return this.queries.getMine(user.id, p.id);
  }

  @Throttle(LIMIT_ORDER)
  @Patch('me/:id/cancel')
  async cancel(@CurrentUser() user: AuthUser, @Param() p: UuidParamDto, @Body() dto: CustomerCancelDto): Promise<OrderResponse> {
    await this.canceller.cancel({ orderId: p.id, actor: CancelActor.CUSTOMER, userId: user.id, reason: dto.reason, note: dto.note });
    return this.queries.getMine(user.id, p.id);
  }
}

@ApiTags('admin / orders')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(
    private readonly queries: OrderQueryService,
    private readonly statuses: OrderStatusService,
    private readonly canceller: OrderCancelService,
  ) {}

  @Get()
  list(@Query() q: AdminListOrdersQueryDto): Promise<Paginated<OrderResponse>> {
    return this.queries.listAdmin(q);
  }

  @Get(':id')
  get(@Param() p: UuidParamDto): Promise<OrderResponse> {
    return this.queries.getAdmin(p.id);
  }

  @Patch(':id/status')
  updateStatus(@CurrentUser() admin: AuthUser, @Param() p: UuidParamDto, @Body() dto: UpdateOrderStatusDto): Promise<OrderResponse> {
    return this.statuses.updateStatus(admin.id, p.id, dto.status);
  }

  @Throttle(LIMIT_ORDER)
  @Patch(':id/cancel')
  async cancel(@Param() p: UuidParamDto, @Body() dto: AdminCancelDto): Promise<OrderResponse> {
    await this.canceller.cancel({ orderId: p.id, actor: CancelActor.ADMIN, reason: dto.reason, note: dto.note });
    return this.queries.getAdmin(p.id);
  }
}
