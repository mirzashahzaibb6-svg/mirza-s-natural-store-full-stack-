import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { PaymentsModule } from '../payments/payments.module';
import { OrderCancelService } from './order-cancel.service';
import { OrderCreateService } from './order-create.service';
import { OrderQueryService } from './order-query.service';
import { OrderStatusService } from './order-status.service';
import { OrdersCron } from './orders.cron';
import { AdminOrdersController, OrdersController } from './orders.controller';
import { OrdersDbService } from './orders.db.service';

@Module({
  imports: [InventoryModule, PaymentsModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersDbService, OrderCreateService, OrderQueryService, OrderStatusService, OrderCancelService, OrdersCron],
})
export class OrdersModule {}
