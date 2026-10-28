import { Module } from '@nestjs/common';
import { AdminCustomersController } from './admin-customers.controller';
import { UsersDbService } from './users.db.service';
import { UsersService } from './users.service';

@Module({
  controllers: [AdminCustomersController],
  providers: [UsersDbService, UsersService],
  exports: [UsersDbService],
})
export class UsersModule {}
