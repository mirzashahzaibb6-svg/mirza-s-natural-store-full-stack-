import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartDbService } from './cart.db.service';
import { CartService } from './cart.service';

@Module({ controllers: [CartController], providers: [CartDbService, CartService] })
export class CartModule {}
