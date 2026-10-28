import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app.setup';
import { DatabaseService } from '../src/database/database.service';
import { Role } from '../src/database/prisma';

export interface Ctx {
  app: INestApplication;
  db: DatabaseService;
  http: () => ReturnType<typeof request>;
}

export async function createApp(): Promise<Ctx> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ rawBody: true });
  setupApp(app);
  await app.init();
  return { app, db: app.get(DatabaseService), http: () => request(app.getHttpServer()) };
}

/** Wipes all data (test database only) and creates the single admin. */
export async function resetDatabase(db: DatabaseService): Promise<void> {
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "idempotency_keys","payments","order_addresses","order_items","orders","cart_items","carts","inventory_transactions","inventories","products","categories","addresses","users" RESTART IDENTITY CASCADE',
  );
  await db.user.create({ data: { name: 'Admin', email: 'admin@test.local', passwordHash: await bcrypt.hash('AdminPass123', 4), role: Role.ADMIN } });
}

export async function login(ctx: Ctx, email: string, password: string): Promise<string> {
  const res = await ctx.http().post('/v1/auth/login').send({ email, password }).expect(200);
  return (res.body as { accessToken: string }).accessToken;
}

export async function registerCustomer(ctx: Ctx, email: string): Promise<string> {
  const res = await ctx.http().post('/v1/auth/register').send({ name: 'Customer', email, password: 'Password123' }).expect(201);
  return (res.body as { accessToken: string }).accessToken;
}

/** Admin creates category + product + inventory; returns ids. */
export async function seedCatalog(ctx: Ctx, adminToken: string, stock: number): Promise<{ categoryId: string; productId: string; inventoryId: string }> {
  const auth = { Authorization: `Bearer ${adminToken}` };
  const cat = await ctx.http().post('/v1/admin/categories').set(auth).send({ name: 'Pantry' }).expect(201);
  const categoryId = (cat.body as { id: string }).id;
  const prod = await ctx.http().post('/v1/admin/products').set(auth).send({ name: 'Honey', categoryId, price: 10.5, minimumOrderQuantity: 1, maximumOrderQuantity: 5 }).expect(201);
  const productId = (prod.body as { id: string }).id;
  const inv = await ctx.http().post('/v1/admin/inventory').set(auth).send({ productId, qtyOnHand: stock }).expect(201);
  return { categoryId, productId, inventoryId: (inv.body as { id: string }).id };
}
