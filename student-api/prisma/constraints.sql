-- Constraints Prisma cannot express. Appended to the init migration by scripts/append-constraints.mjs.

-- 1) Exactly one ADMIN (partial unique index).
CREATE UNIQUE INDEX "users_single_admin_key" ON "users" ("role") WHERE "role" = 'ADMIN';

-- 2) At most one default address per user.
CREATE UNIQUE INDEX "addresses_one_default_per_user_key" ON "addresses" ("userId") WHERE "isDefault" = true;

-- 3) Stock can never be negative.
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_qty_non_negative" CHECK ("qtyOnHand" >= 0);
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_threshold_non_negative" CHECK ("lowStockThreshold" >= 0);

-- 4) Product rules.
ALTER TABLE "products" ADD CONSTRAINT "products_price_min" CHECK ("price" >= 0.01);
ALTER TABLE "products" ADD CONSTRAINT "products_qty_limits" CHECK ("minimumOrderQuantity" >= 1 AND "maximumOrderQuantity" >= "minimumOrderQuantity");

-- 5) Quantities on carts and orders are positive.
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_qty_positive" CHECK ("quantity" >= 1);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_qty_positive" CHECK ("quantity" >= 1);

-- 6) Concurrency-safe generators (never MAX()+1).
CREATE SEQUENCE IF NOT EXISTS "order_number_seq" START 1;
CREATE SEQUENCE IF NOT EXISTS "product_sku_seq" START 1;
