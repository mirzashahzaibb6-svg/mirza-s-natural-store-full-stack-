# Mirza’s Natural Store (OnlineMart) — Full-stack project

Luxury online grocery store: **NestJS 11 + Prisma 7 + PostgreSQL** API and **Next.js 16 + React 19 + Tailwind v4** web app.

> **Roman Urdu quick start:** neeche "Setup" ke commands ko upar se neeche chalayen (Docker → API → Web). Browser mein `http://localhost:3000` kholen. Admin login `student-api/.env` ke `ADMIN_EMAIL` / `ADMIN_PASSWORD` se hota hai.

## Honest status

All code was written and syntax-checked, but **`npm install`, the database, the tests and the builds have NOT been run yet** (the authoring sandbox had no internet). Treat every "pass" as unproven until you run the commands below on your machine. If a command fails, send me the exact error text and I will fix it.

## What you need

- Node.js 22 LTS, Docker Desktop, VS Code (open `mirzas-natural-store.code-workspace`)
- Optional: Bun (the `package.json` files also work with `bun install`; the commands below use npm)

## Setup (Windows PowerShell)

```powershell
# 1) Database (PostgreSQL 16 in Docker; also creates the onlinemart_test database)
docker compose up -d

# 2) API
cd student-api
copy .env.example .env          # then edit .env: set JWT_SECRET (32+ chars), PAYMENT_WEBHOOK_SECRET, ADMIN_* values
npm install
npm run db:init                 # generate Prisma client + create migration + add DB constraints + apply + seed admin
npm run db:seed:demo            # OPTIONAL demo catalog (dates, saffron, honey, ghee ...)
npm run start:dev               # http://localhost:4000/v1   (Swagger: /v1/docs, health: /v1/health)

# 3) Web (new terminal)
cd student-web
copy .env.example .env.local
npm install
npm run dev                     # http://localhost:3000
```

Generate a strong secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

First admin login: the e-mail and password you put in `student-api/.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). Customers register on the site (role can never be chosen by the user).

## Quality commands

| Where | Command | What it checks |
|---|---|---|
| `student-api` | `npm run lint` · `npm run typecheck` | ESLint, TypeScript |
| `student-api` | `npm test` | unit tests (run `npm run prisma:generate` first) |
| `student-api` | `npm run test:e2e` | real-PostgreSQL tests: auth, role escalation, last-unit race, idempotent checkout, webhook signature, refunds |
| `student-api` | `npm run build` | production build |
| `student-web` | `npm run lint` · `npm run typecheck` · `npm test` · `npm run build` | frontend gates |

E2E setup: `copy .env.test.example .env.test`. The test database must exist. If your Docker volume was created before this project, run once:
`docker exec -it onlinemart-postgres psql -U onlinemart -c "CREATE DATABASE onlinemart_test;"`

## How the main flow works

1. Customer adds items to the basket (server price, stock check, min/max rules).
2. **Checkout** (`POST /v1/orders`, header `Idempotency-Key`) runs in ONE database transaction: locks inventory rows (sorted), deducts stock, writes order + items + address snapshot + ledger rows, clears the cart. Any failure rolls everything back.
3. The order is `PENDING/UNPAID` for **5 minutes**. Payment page → mock gateway → signed event → same handler as the webhook → order `CONFIRMED`.
4. A cron job (every minute) cancels unpaid expired orders and returns stock; it also retries pending refunds.
5. Admin moves orders `CONFIRMED → PROCESSING → READY_FOR_PICKUP/READY_FOR_DELIVERY → DELIVERED`. Cancelling a paid order starts a refund (`REFUND_PENDING → REFUNDED`).

## Folder map

```
docker-compose.yml     PostgreSQL (dev + test databases)
student-api/           NestJS API  (src/modules/*, prisma/, test/)
student-web/           Next.js app (src/app, src/services, src/modules/zod, src/components)
notes/                 requirements, decisions, implementation status, architecture
docs/design-prototype/ the approved arch-themed visual prototype (reference only)
```

## Not built (optional backlog)

Stripe, Redis/Bull queues, image uploads, email, reviews, audit log, **QR-scan login** (the prototype showed it; the real feature needs a QR-session table + a signed-in phone to approve — see `notes/decisions.md` D-10).

## Security notes

Passwords: bcrypt cost 12 · JWT secret ≥ 32 chars from `.env` · every route is deny-by-default · single ADMIN enforced in the database · responses never contain password hashes · webhook signature (HMAC-SHA256) is checked before any database work · secrets are never in `NEXT_PUBLIC_*`.
