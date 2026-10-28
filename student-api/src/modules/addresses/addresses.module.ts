import { Module } from '@nestjs/common';
import { AddressesController } from './addresses.controller';
import { AddressesDbService } from './addresses.db.service';
import { AddressesService } from './addresses.service';

@Module({
  controllers: [AddressesController],
  providers: [AddressesDbService, AddressesService],
  exports: [AddressesDbService],
})
export class AddressesModule {}
