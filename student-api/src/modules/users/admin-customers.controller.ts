import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser, Paginated } from '../../common/types';
import { Role } from '../../database/prisma';
import { UuidParamDto } from './dto/customer-id-param.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerStatusDto } from './dto/update-customer-status.dto';
import type { UserResponse } from './types';
import { UsersService } from './users.service';

@ApiTags('admin / customers')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/customers')
export class AdminCustomersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@Query() query: ListCustomersQueryDto): Promise<Paginated<UserResponse>> {
    return this.users.listCustomers(query);
  }

  @Patch(':id/status')
  setStatus(@CurrentUser() admin: AuthUser, @Param() params: UuidParamDto, @Body() dto: UpdateCustomerStatusDto): Promise<UserResponse> {
    return this.users.setStatus(admin.id, params.id, dto.isActive);
  }
}
