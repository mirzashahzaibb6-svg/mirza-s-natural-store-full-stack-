import { Module } from '@nestjs/common';
import { AdminCategoriesController, CategoriesController } from './categories.controller';
import { CategoriesDbService } from './categories.db.service';
import { CategoriesService } from './categories.service';

@Module({
  controllers: [CategoriesController, AdminCategoriesController],
  providers: [CategoriesDbService, CategoriesService],
  exports: [CategoriesDbService],
})
export class CategoriesModule {}
