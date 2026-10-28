import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryDbService } from './inventory.db.service';
import { InventoryService } from './inventory.service';

@Module({
  controllers: [InventoryController],
  providers: [InventoryDbService, InventoryService],
  exports: [InventoryDbService],
})
export class InventoryModule {}
