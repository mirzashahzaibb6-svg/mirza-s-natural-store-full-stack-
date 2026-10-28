import { createApp, login, registerCustomer, resetDatabase, type Ctx } from './e2e-helpers';

describe('Auth and security (e2e, real PostgreSQL)', () => {
  let ctx: Ctx;
  beforeAll(async () => { ctx = await createApp(); });
  beforeEach(async () => { await resetDatabase(ctx.db); });
  afterAll(async () => { await ctx.app.close(); });

  it('GET /v1/health is public', async () => {
    await ctx.http().get('/v1/health').expect(200);
  });

  it('register always creates a CUSTOMER and never returns a password hash', async () => {
    const res = await ctx.http().post('/v1/auth/register').send({ name: 'Sam', email: 'Sam@Test.local ', password: 'Password123' }).expect(201);
    expect(res.body.user.role).toBe('CUSTOMER');
    expect(res.body.user.email).toBe('sam@test.local');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('rejects role escalation in the request body (400)', async () => {
    await ctx.http().post('/v1/auth/register').send({ name: 'Eve', email: 'eve@test.local', password: 'Password123', role: 'ADMIN' }).expect(400);
  });

  it('duplicate email is 409; wrong password and unknown email share one 401 message', async () => {
    await registerCustomer(ctx, 'dup@test.local');
    await ctx.http().post('/v1/auth/register').send({ name: 'X', email: 'dup@test.local', password: 'Password123' }).expect(409);
    const wrong = await ctx.http().post('/v1/auth/login').send({ email: 'dup@test.local', password: 'WrongPass123' }).expect(401);
    const unknown = await ctx.http().post('/v1/auth/login').send({ email: 'nobody@test.local', password: 'WrongPass123' }).expect(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });

  it('the database itself refuses a second ADMIN', async () => {
    await expect(ctx.db.user.create({ data: { name: 'Second', email: 'second@test.local', passwordHash: 'x', role: 'ADMIN' } })).rejects.toBeDefined();
  });

  it('routes are deny-by-default: no token = 401, customer on admin route = 403', async () => {
    await ctx.http().get('/v1/cart').expect(401);
    const customer = await registerCustomer(ctx, 'c@test.local');
    await ctx.http().get('/v1/admin/customers').set('Authorization', `Bearer ${customer}`).expect(403);
    const admin = await login(ctx, 'admin@test.local', 'AdminPass123');
    await ctx.http().get('/v1/cart').set('Authorization', `Bearer ${admin}`).expect(403); // admin has no cart
  });

  it('a deactivated customer is blocked immediately, even with a still-valid token', async () => {
    const token = await registerCustomer(ctx, 'off@test.local');
    const admin = await login(ctx, 'admin@test.local', 'AdminPass123');
    const user = await ctx.db.user.findUniqueOrThrow({ where: { email: 'off@test.local' } });
    await ctx.http().patch(`/v1/admin/customers/${user.id}/status`).set('Authorization', `Bearer ${admin}`).send({ isActive: false }).expect(200);
    await ctx.http().get('/v1/auth/me').set('Authorization', `Bearer ${token}`).expect(403);
  });

  it('negative stock is impossible at the database level', async () => {
    const admin = await login(ctx, 'admin@test.local', 'AdminPass123');
    const { seedCatalog } = await import('./e2e-helpers');
    const { inventoryId } = await seedCatalog(ctx, admin, 1);
    await expect(ctx.db.inventory.update({ where: { id: inventoryId }, data: { qtyOnHand: -1 } })).rejects.toBeDefined();
  });
});
