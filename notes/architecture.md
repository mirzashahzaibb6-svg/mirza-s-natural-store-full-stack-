# Architecture (summary)

## Backend layers (per module)
`controller` (HTTP, DTO validation, roles) → `service` (business rules) → `*.db.service` (the only Prisma calls) → PostgreSQL.
Shared: `common/` (guards, filter, pagination), `shared/money`, `infrastructure/payment` (PaymentGateway interface + MockPaymentGateway), `database/`.

## Route inventory (41)
Public/auth (7): GET /health · POST /auth/register · POST /auth/login · GET /auth/me · GET /categories · GET /products · GET /products/:id
Customer (16): addresses ×5 · cart ×5 · orders ×4 (POST, GET me, GET me/:id, PATCH me/:id/cancel) · payments ×2 (initiate, :id/mock-complete)
Admin (17): customers ×2 · categories ×4 · products ×3 (GET, POST, PATCH) · inventory ×4 · orders ×4
Webhook (1): POST /webhooks/payments/mock (HMAC signed)

## Order / payment state machine
```
PENDING/UNPAID --pay--> CONFIRMED/PAID --> PROCESSING --> READY_FOR_PICKUP | READY_FOR_DELIVERY --> DELIVERED
PENDING/UNPAID --timeout or cancel--> CANCELLED (stock restored)
CONFIRMED..READY_* + PAID --cancel--> REFUND_PENDING --refund ok--> CANCELLED/REFUNDED   (gateway failure: stays REFUND_PENDING, cron retries)
payment after cancel --> payment REFUND_PENDING --> REFUNDED (order never revived)
```
Every transition is a guarded `UPDATE … WHERE status = <expected>`; zero rows updated means "someone else already did it", so side effects (stock, refund, counters) run exactly once.

## Checkout transaction
idempotency key row → read cart → validate delivery → lock inventory rows (sorted by product id) → check stock → totals from server prices → create order/items/address → CONSUMED ledger rows + stock deduction → clear cart → link idempotency record. Notifications and gateway calls only after commit.

## Frontend
App Router pages are thin; data comes from `services/<domain>/hooks.ts` (TanStack Query) through one `request()` wrapper (Bearer token, ApiError, only 401 clears the session). Forms: React Hook Form + Zod. Auth state: Zustand (persisted, manual hydration). Design tokens in `globals.css` (`@theme`).
