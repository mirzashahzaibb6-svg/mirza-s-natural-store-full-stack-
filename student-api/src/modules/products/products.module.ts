import { Module } from '@nestjs/common';
import { AdminProductsController, ProductsController } from './products.controller';
import { ProductsDbService } from './products.db.service';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsDbService, ProductsService],
})
export class ProductsModule {}
