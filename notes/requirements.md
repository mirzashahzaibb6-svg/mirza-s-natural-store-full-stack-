# OnlineMart (storefront brand: Mirza’s Natural Store) — Requirements

**Source of truth for this audit:** the Master Prompt only. The documentation ZIP (`README.md`, `01`–`14`, `api-reference.md`) was **not supplied**, so nothing here claims to come from those files. See `decisions.md` D-01.

**Classification tags:** `CORE — IMPLEMENT` · `OPTIONAL — BACKLOG` · `KNOWN GAP — FIX` · `DOCUMENTED DECISION` (see `decisions.md`).

## 1. Actors

| Actor | Rules | Tag |
|---|---|---|
| ADMIN | Exactly one. Created only by seed script from `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`. Manages customers, categories, products, inventory, orders. Cannot deactivate self. | CORE |
| CUSTOMER | Created by public registration (role is never accepted from input). Own addresses, cart, orders, mock payment. | CORE |
| Guest | Only health, auth (register/login) and public catalog routes. | CORE |
| SYSTEM | Cron work (payment timeout, refund retry). Not a login role. | CORE |

Single-admin enforcement at 3 levels: no `role` in public DTOs, no role-change endpoint, PostgreSQL partial unique index on `users(role)` where `role = 'ADMIN'`.

## 2. Functional scope

### 2.1 Auth — CORE
- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`; frontend logout.
- Global deny-by-default `JwtAuthGuard`; `@Public()`, `@Roles()`, `RolesGuard`, current-user decorator.
- bcrypt cost 12; password 8–72 chars; email trim + lowercase.
- JWT `{ sub, role }`, `JWT_SECRET` ≥ 32 chars, `JWT_EXPIRES_IN`. Every protected request reloads the user, checks `isActive`, uses the DB role.
- Same 401 text `Invalid email or password` for unknown email and wrong password.
- Rate limits: login/register 10/min/IP; payment 5/min; order create/cancel 20/min.
- No refresh token, no password reset (core).

### 2.2 Customer administration — CORE
- `GET /admin/customers` (pagination, search, `isActive`), `PATCH /admin/customers/:id/status`.
- Targets customers only; admin cannot deactivate self. Audit record: see D-07.

### 2.3 Addresses — CORE
- `GET/POST /addresses`, `PATCH/DELETE /addresses/:id`, `PATCH /addresses/:id/default`.
- Fields: `addressLine` ≤100, `city` ≤30, `county` ≤30, `postcode` ≤20, `isDefault`.
- One default per user (partial unique index); default switch in a transaction; deleting the default promotes the newest remaining address; queries scoped by `{ id, userId }`; foreign address → 404.

### 2.4 Categories — CORE
- Public `GET /categories` (pagination, search, `parentId`, active only).
- Admin `GET/POST/PATCH/DELETE /admin/categories`.
- Unique name and slug; slug from name; no self-parent, no cycles, no re-parent under a descendant; products only in active leaf categories; category with products cannot get children; no delete with children/products (409); descendant path/depth updated in a transaction.
- Depth: two levels (D-02).

### 2.5 Products — CORE
- Public `GET /products` (page, `q`, `categoryId`, `minPrice`, `maxPrice`, sort `newest|price_asc|price_desc|name_asc`), `GET /products/:id` (inactive → 404).
- Admin `GET/POST/PATCH /admin/products` (inactive visible to admin).
- Fields: `name`, `description?`, `categoryId`, `price ≥ 0.01`, `minimumOrderQuantity`, `maximumOrderQuantity` (integers ≥1, max ≥ min), `isActive`.
- `@@unique([name, categoryId])`; unique slug and SKU; SKU via DB sequence (never `MAX()+1`); deactivate instead of delete.
- File uploads, images, allergens, brands, suppliers: OPTIONAL — BACKLOG.

### 2.6 Inventory and ledger — CORE
- Admin `GET/POST /admin/inventory`, `POST /admin/inventory/adjustments`, `GET /admin/inventory/:id/transactions`.
- One inventory row per product (duplicate → 409); `lowStockThreshold` default 10.
- Movement types: `RECEIVED`, `ADJUSTMENT_INCREASE`, `ADJUSTMENT_DECREASE`, `CONSUMED`, `RELEASED`.
- Status: ≤0 `OUT_OF_STOCK`; ≤threshold `LOW_STOCK`; else `IN_STOCK`.
- Quantity ≠ 0; no negative stock (service + CHECK `qtyOnHand >= 0`); `DAMAGE` and `RETURN_TO_SUPPLIER` must be negative; row lock with `SELECT … FOR UPDATE`; stock + ledger atomic.
- Batch/expiry tracking: OPTIONAL — BACKLOG.

### 2.7 Cart — CORE (customer only; admin → 403)
- `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id` (0 = remove), `DELETE /cart/items/:id`, `DELETE /cart`.
- One cart per user; one row per `(cartId, productId)`; product active and in stock; first add respects minimum; max = `min(available stock, maximumOrderQuantity)`.
- POST increments (not idempotent, documented); price always from the server; no stock reservation.
- Response: items, `isAvailable`, `maxAllowedQuantity`, subtotal, grand total (decimal strings).

### 2.8 Checkout / order creation — CORE (critical)
- `POST /orders`: `deliveryType` DELIVERY|PICKUP, `addressId?`, `shippingAddress?`, `pickupScheduledAt?`, `customerNotes` ≤500.
- DELIVERY: exactly one of `addressId` / `shippingAddress`, no `pickupScheduledAt`. PICKUP: `pickupScheduledAt` required, no address.
- One DB transaction: read cart → sort products by id → lock inventory → deduct stock → money totals → order + items + address snapshot → `CONSUMED` ledger rows → clear cart → commit; notifications only after commit.
- Starts `PENDING` / `UNPAID`; `paymentExpiresAt = now + 5 min`; order number from a DB sequence (`ORD-<YEAR>-<000001>`); shipping 0 via central config.
- `Idempotency-Key`: see D-03.

### 2.9 Order queries and status — CORE
- `GET /orders/me`, `GET /orders/me/:id`, `GET /admin/orders` (status, paymentStatus, search, dateFrom, dateTo), `GET /admin/orders/:id`.
- Statuses: `PENDING`, `CONFIRMED`, `PROCESSING`, `READY_FOR_PICKUP`, `READY_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `REFUND_PENDING`.
- `PATCH /admin/orders/:id/status`: CONFIRMED→PROCESSING; PROCESSING→READY_FOR_PICKUP (PICKUP only) or READY_FOR_DELIVERY (DELIVERY only); READY_*→DELIVERED. Everything else 400; guarded update `WHERE status = expected`, no row → 409. Timestamps: `confirmedAt`, `processedAt`, `readyAt`, `deliveredAt`, `cancelledAt`.

### 2.10 Cancellation — CORE
- Customer `PATCH /orders/me/:id/cancel` (PENDING/CONFIRMED only). Reasons: `CHANGED_MIND`, `ORDERED_BY_MISTAKE`, `FOUND_BETTER_PRICE`, `DELIVERY_TOO_LONG`, `OTHER` (note required, ≤500).
- Admin `PATCH /admin/orders/:id/cancel`. Reasons: `CUSTOMER_REQUEST`, `OUT_OF_STOCK`, `PAYMENT_ISSUE`, `OTHER`. Allowed before DELIVERED.
- One shared cancellation logic: guarded state change, restore stock exactly once from `CONSUMED` rows, write `RELEASED` rows. Repeat cancel returns success without a second restore.
- Unpaid: CANCELLED, gateway cancel after commit. Paid: `REFUND_PENDING` → restore stock → gateway refund after commit → payment `REFUNDED`, order `CANCELLED`, `totalSpent` decremented once; failure stays `REFUND_PENDING` for retry. No network call inside a DB transaction.

### 2.11 Payments (mock) — CORE
- `PaymentGateway` interface in `infrastructure/payment/`: `createIntent`, `cancel`, `refund`, `signEvent`, `verifyEvent`; `MockPaymentGateway` injected by token.
- `POST /payments/initiate`, `POST /payments/:id/mock-complete`, `POST /webhooks/payments/mock` (HMAC-SHA256 `x-signature`, `timingSafeEqual`).
- Amount from `order.total`; one reusable payment per order; unique `gatewayRef`.
- `payment.succeeded`: only if payment not PAID and order PENDING → payment PAID, order CONFIRMED, update `totalOrders`/`totalSpent` once. `payment.failed`: payment FAILED, order stays PENDING. Duplicates are harmless. Late success on a cancelled/expired order → refund, no revival. Full refund only.

### 2.12 Timeout and refund retry — CORE
- `@nestjs/schedule`; sweep finds `PENDING` with `paymentExpiresAt < now`, cancels atomically via shared logic, gateway cancel after commit; retry cron for `REFUND_PENDING`. Interval: D-06. No Redis/Bull.

### 2.13 Money — CORE
- `Decimal(10,2)`, no Float; central `MoneyService`; API returns strings with two decimals; no client-supplied amounts.

## 3. Database (CORE)
Models: `User`, `Address`, `Category`, `Product`, `Inventory`, `InventoryTransaction`, `Cart`, `CartItem`, `Order`, `OrderItem`, `OrderAddress`, `Payment`, idempotency table. UUID ids. Constraints: unique email; single-ADMIN partial index; one cart per user; one item per product per cart; unique product name per category, slug, SKU; one inventory per product; `qtyOnHand >= 0`; one default address per user; unique order number; unique `gatewayRef`; indexes for catalog queries, `(userId, createdAt)`, `(status, paymentExpiresAt)`, ledger lookups. Raw SQL in migrations (partial indexes, CHECK, sequences), parameterized only.

## 4. Backend architecture (CORE)
Layers: `dto/`, controller, service, `*.db.service.ts` (the only place with Prisma calls), `types/`, `mappers/`, infrastructure, shared/common. `main.ts`: prefix `v1`, helmet, env CORS allowlist, global `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })`, global exception filter, dev-only Swagger at `/v1/docs`, shutdown hooks. Env validation at startup; `Logger` without secrets.

## 5. API conventions (CORE)
`/v1`; JSON; ISO-8601 dates; `UPPER_SNAKE_CASE` enums; lists `{ data, meta: { total, currentPage, limit, pages, hasNextPage, hasPrevPage } }`; `page ≥ 1`, `limit` 1–100 default 10; whitelisted sort keys; UUID params validated; 201 create / 200 read-update-action / 204 delete. Errors: 400 validation/business, 401 auth, 403 role/deactivated, 404 missing or foreign resource, 409 conflict/race, 429 rate limit, 500 generic.

Endpoint inventory (target list): 7 public/auth, 16 customer, 17 admin, 1 webhook = **41 routes** (`GET /health` included in public).

## 6. Frontend (CORE)
Next.js 16 App Router, React 19, TanStack Query v5, React Hook Form, Zod v4, Zustand, Tailwind v4, shadcn-style UI, lucide-react, sonner. Pages: login, register, shop, cart, checkout, checkout/payment, orders, orders/[id], addresses, admin categories/products/inventory/orders/orders/[id]/customers. Shared primitives: `InputField`, `Pagination`, `EmptyState`, `ErrorState`, `TableSkeleton`, `StatusBadge`, `ConfirmDialog`, `SearchInput`. `request<T>()` wrapper: Bearer token, `ApiError`, 401 clears auth, network/429/5xx never log the user out. Stable checkout idempotency key via `useRef`. `NEXT_PUBLIC_API_URL=http://localhost:4000/v1`; no secrets in `NEXT_PUBLIC_*`.

## 7. Acceptance tests (Section 9 of the prompt)
25 mandatory checks: (1) register always CUSTOMER, extra `role` → 400; (2) duplicate email 409, identical 401 text; (3) second ADMIN rejected by DB; (4) deactivated user's old JWT → 403; (5) no `passwordHash` in responses; (6) role/ownership 403/404; (7) inactive products hidden; (8) category depth/cycle/leaf rules; (9) max<min 400, duplicate name 409; (10) bad adjustment direction, no negative stock; (11) cart min/max/stock, admin 403; (12) DELIVERY/PICKUP validation; (13) checkout rollback; (14) last-unit race; (15) idempotent retry; (16) payment reuse, server amount; (17) bad signature 400 with zero mutation; (18) duplicate webhook counts once; (19) cannot cancel PROCESSING, foreign order 404; (20) paid cancel → REFUND_PENDING → REFUNDED, failure retryable; (21) no double restore/refund/count; (22) timeout restores stock, late success refunds; (23) 500 leaks no stack/SQL; (24) frontend 401 vs network/429/5xx; (25) lint, typecheck, unit, real-Postgres e2e, frontend tests, both builds pass.

**Evidence rule:** none of these is marked PASS until the command was actually run and its output seen.

## 8. Optional backlog (NOT core)
Brands/suppliers · images and uploads · allergens · batch inventory/expiry/FEFO · Stripe test mode · Bull/Redis queues · R2/S3 uploads · SMTP2GO emails · SSE/in-app notifications · verified-purchase reviews · admin dashboard/CSV · audit log · profile update/anonymization · multi-instance scaling · **QR-scan login (added by the user, not in the prompt — see D-10)**.

## 9. Not available to this audit
Files `01`–`14` and `api-reference.md`. Anything those files add beyond this prompt is unknown and will be flagged `NOT RUN / NOT VERIFIED` in Phase 20.
