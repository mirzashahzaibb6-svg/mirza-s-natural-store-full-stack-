import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { InventoryMovementType, PrismaClient, StockStatus } from '../src/generated/prisma/client';

// OPTIONAL demo catalog (separate from the admin seed). Safe to re-run: existing names are skipped.
const DEMO: Array<{ category: string; items: Array<{ name: string; price: string; qty: number; description: string }> }> = [
  { category: 'Dry Fruit', items: [
    { name: 'Ajwa Dates 500g', price: '3200.00', qty: 40, description: 'Soft, rich Ajwa dates from Madinah.' },
    { name: 'Roasted Pistachios 400g', price: '2800.00', qty: 30, description: 'Lightly salted, slow roasted.' },
  ] },
  { category: 'Pantry', items: [
    { name: 'Kashmiri Saffron 2g', price: '4500.00', qty: 15, description: 'Hand-picked saffron threads.' },
    { name: 'Wild Forest Honey 500g', price: '2200.00', qty: 25, description: 'Unheated wild honey.' },
    { name: 'Pure Desi Ghee 1kg', price: '3600.00', qty: 20, description: 'Slow-churned desi ghee.' },
    { name: 'Extra Virgin Olive Oil 500ml', price: '2900.00', qty: 35, description: 'First cold press.' },
  ] },
  { category: 'Tea and Coffee', items: [
    { name: 'Kashmiri Pink Chai 200g', price: '1400.00', qty: 50, description: 'Loose-leaf pink tea.' },
    { name: 'Single-Origin Coffee 250g', price: '1950.00', qty: 8, description: 'Medium roast, whole beans.' },
  ] },
];

const slugify = (s: string): string => s.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-');

async function main(): Promise<void> {
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    for (const group of DEMO) {
      let category = await db.category.findUnique({ where: { name: group.category } });
      if (!category) {
        const id = randomUUID();
        category = await db.category.create({
          data: { id, name: group.category, slug: slugify(group.category), depth: 0, path: `/${id}` },
        });
      }
      for (const item of group.items) {
        const exists = await db.product.findFirst({ where: { name: item.name, categoryId: category.id } });
        if (exists) continue;
        const rows = await db.$queryRaw<{ n: bigint }[]>`SELECT nextval('product_sku_seq') AS n`;
        const num = Number(rows[0].n);
        const product = await db.product.create({
          data: {
            name: item.name, slug: `${slugify(item.name)}-${num}`, sku: `SKU-${String(num).padStart(6, '0')}`,
            description: item.description, categoryId: category.id, price: item.price,
            minimumOrderQuantity: 1, maximumOrderQuantity: 10,
          },
        });
        const status = item.qty <= 0 ? StockStatus.OUT_OF_STOCK : item.qty <= 10 ? StockStatus.LOW_STOCK : StockStatus.IN_STOCK;
        const inv = await db.inventory.create({
          data: { productId: product.id, qtyOnHand: item.qty, lowStockThreshold: 10, status },
        });
        await db.inventoryTransaction.create({
          data: { inventoryId: inv.id, type: InventoryMovementType.RECEIVED, quantity: item.qty, quantityAfter: item.qty, reason: 'RECEIVED_STOCK', note: 'Demo seed' },
        });
      }
    }
    console.log('Demo catalog ready.');
  } finally {
    await db.$disconnect();
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
