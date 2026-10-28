import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { buildMeta } from '../../common/pagination/pagination';
import type { Paginated } from '../../common/types';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import type { UserResponse } from './types';
import { toUserResponse } from './user.mapper';
import { UsersDbService } from './users.db.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersDb: UsersDbService) {}

  async listCustomers(query: ListCustomersQueryDto): Promise<Paginated<UserResponse>> {
    const { rows, total } = await this.usersDb.listCustomers(query);
    return { data: rows.map(toUserResponse), meta: buildMeta(total, query.page, query.limit) };
  }

  async setStatus(adminId: string, customerId: string, isActive: boolean): Promise<UserResponse> {
    if (adminId === customerId) throw new BadRequestException('Admin cannot change their own status');
    const user = await this.usersDb.setCustomerActive(customerId, isActive);
    if (!user) throw new NotFoundException('Customer not found');
    this.logger.log(`admin=${adminId} set customer=${customerId} isActive=${isActive}`);
    return toUserResponse(user);
  }
}
