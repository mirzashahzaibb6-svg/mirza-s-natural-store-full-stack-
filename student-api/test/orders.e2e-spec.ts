import { createApp, login, registerCustomer, resetDatabase, seedCatalog, type Ctx } from './e2e-helpers';

describe('Checkout, payments and cancellation (e2e, real PostgreSQL)', () => {
  let ctx: Ctx;
  let admin: string;
  beforeAll(async () => { ctx = await createApp(); });
  beforeEach(async () => { await resetDatabase(ctx.db); admin = await login(ctx, 'admin@test.local', 'AdminPass123'); });
  afterAll(async () => { await ctx.app.close(); });

  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
  const pickupBody = () => ({ deliveryType: 'PICKUP', pickupScheduledAt: new Date(Date.now() + 3_600_000).toISOString() });

  async function addToCart(token: string, productId: string, quantity: number) {
    return ctx.http().post('/v1/cart/items').set(auth(token)).send({ productId, quantity });
  }
  async function checkout(token: string, key: string) {
    return ctx.http().post('/v1/orders').set(auth(token)).set('Idempotency-Key', key).send(pickupBody());
  }
  async function stockOf(inventoryId: string) {
    return (await ctx.db.inventory.findUniqueOrThrow({ where: { id: inventoryId } })).qtyOnHand;
  }

  it('checkout deducts stock, clears the cart and a retry with the same key returns the same order', async () => {
    const { productId, inventoryId } = await seedCatalog(ctx, admin, 10);
    const token = await registerCustomer(ctx, 'a@test.local');
    await addToCart(token, productId, 2).then((r) => expect(r.status).toBe(201));

    const first = await checkout(token, 'key-12345678');
    expect(first.status).toBe(201);
    expect(first.body.total).toBe('21.00');
    expect(await stockOf(inventoryId)).toBe(8);

    const retry = await checkout(token, 'key-12345678');
    expect(retry.status).toBe(201);
    expect(retry.body.id).toBe(first.body.id);
    expect(await stockOf(inventoryId)).toBe(8); // not deducted twice

    const cart = await ctx.http().get('/v1/cart').set(auth(token)).expect(200);
    expect(cart.body.items).toHaveLength(0);
  });

  it('the last unit is sold exactly once when two customers check out at the same time', async () => {
    const { productId, inventoryId } = await seedCatalog(ctx, admin, 1);
    const a = await registerCustomer(ctx, 'a@test.local');
    const b = await registerCustomer(ctx, 'b@test.local');
    await addToCart(a, productId, 1);
    await addToCart(b, productId, 1);
    const [ra, rb] = await Promise.all([checkout(a, 'key-aaaaaaaa'), checkout(b, 'key-bbbbbbbb')]);
    expect([ra.status, rb.status].sort()).toEqual([201, 400]);
    expect(await stockOf(inventoryId)).toBe(0);
  });

  it('a failed checkout leaves stock untouched (rollback)', async () => {
    const { productId, inventoryId } = await seedCatalog(ctx, admin, 3);
    const token = await registerCustomer(ctx, 'a@test.local');
    await addToCart(token, productId, 3);
    await ctx.db.inventory.update({ where: { id: inventoryId }, data: { qtyOnHand: 1 } }); // stock drops after carting
    const res = await checkout(token, 'key-rollback1');
    expect(res.status).toBe(400);
    expect(await stockOf(inventoryId)).toBe(1);
    expect(await ctx.db.order.count()).toBe(0);
  });

  it('paid order: bad webhook signature changes nothing, valid webhook confirms once, duplicates are harmless', async () => {
    const { productId } = await seedCatalog(ctx, admin, 5);
    const token = await registerCustomer(ctx, 'a@test.local');
    await addToCart(token, productId, 1);
    const order = (await checkout(token, 'key-pay-12345')).body as { id: string; total: string };
    const pay = await ctx.http().post('/v1/payments/initiate').set(auth(token)).send({ orderId: order.id }).expect(201);
    expect(pay.body.amount).toBe(order.total); // amount comes from the server

    const body = JSON.stringify({ eventId: 'evt1', type: 'payment.succeeded', gatewayRef: pay.body.gatewayRef });
    await ctx.http().post('/v1/webhooks/payments/mock').set('Content-Type', 'application/json').set('x-signature', 'bad').send(body).expect(400);
    expect((await ctx.db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('PENDING');

    const { createHmac } = await import('node:crypto');
    const signature = createHmac('sha256', process.env.PAYMENT_WEBHOOK_SECRET as string).update(body).digest('hex');
    for (let i = 0; i < 2; i += 1) {
      await ctx.http().post('/v1/webhooks/payments/mock').set('Content-Type', 'application/json').set('x-signature', signature).send(body).expect(200);
    }
    const user = await ctx.db.user.findUniqueOrThrow({ where: { email: 'a@test.local' } });
    expect((await ctx.db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('CONFIRMED');
    expect(user.totalOrders).toBe(1); // counted once despite the duplicate event
  });

  it('cancelling a paid order restores stock once and ends REFUNDED (repeat cancel is safe)', async () => {
    const { productId, inventoryId } = await seedCatalog(ctx, admin, 5);
    const token = await registerCustomer(ctx, 'a@test.local');
    await addToCart(token, productId, 2);
    const order = (await checkout(token, 'key-cancel-123')).body as { id: string };
    const pay = await ctx.http().post('/v1/payments/initiate').set(auth(token)).send({ orderId: order.id }).expect(201);
    await ctx.http().post(`/v1/payments/${pay.body.id}/mock-complete`).set(auth(token)).send({ outcome: 'SUCCESS' }).expect(200);
    expect(await stockOf(inventoryId)).toBe(3);

    const first = await ctx.http().patch(`/v1/orders/me/${order.id}/cancel`).set(auth(token)).send({ reason: 'CHANGED_MIND' }).expect(200);
    expect(first.body.status).toBe('CANCELLED');
    expect(first.body.paymentStatus).toBe('REFUNDED');
    await ctx.http().patch(`/v1/orders/me/${order.id}/cancel`).set(auth(token)).send({ reason: 'CHANGED_MIND' }).expect(200);
    expect(await stockOf(inventoryId)).toBe(5); // restored exactly once
  });

  it("another customer's order is a 404, and PROCESSING orders cannot be cancelled by the customer", async () => {
    const { productId } = await seedCatalog(ctx, admin, 5);
    const a = await registerCustomer(ctx, 'a@test.local');
    const b = await registerCustomer(ctx, 'b@test.local');
    await addToCart(a, productId, 1);
    const order = (await checkout(a, 'key-idor-12345')).body as { id: string };
    await ctx.http().get(`/v1/orders/me/${order.id}`).set(auth(b)).expect(404);

    const pay = await ctx.http().post('/v1/payments/initiate').set(auth(a)).send({ orderId: order.id }).expect(201);
    await ctx.http().post(`/v1/payments/${pay.body.id}/mock-complete`).set(auth(a)).send({ outcome: 'SUCCESS' }).expect(200);
    await ctx.http().patch(`/v1/admin/orders/${order.id}/status`).set(auth(admin)).send({ status: 'PROCESSING' }).expect(200);
    await ctx.http().patch(`/v1/orders/me/${order.id}/cancel`).set(auth(a)).send({ reason: 'CHANGED_MIND' }).expect(400);
    await ctx.http().patch(`/v1/admin/orders/${order.id}/status`).set(auth(admin)).send({ status: 'DELIVERED' }).expect(400); // skipping steps
  });
});
