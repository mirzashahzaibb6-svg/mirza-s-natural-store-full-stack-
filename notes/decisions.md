# Decisions and documented conflicts

Format: **ID — Title** · Context · Decision · Impact. Tag: `DOCUMENTED DECISION` unless noted.

## D-01 — Documentation ZIP not supplied
- Context: the prompt requires `README.md`, `01`–`14`, `api-reference.md`. Only the Master Prompt was uploaded.
- Decision: continue from the Master Prompt alone (the owner chose to proceed without the ZIP). Anything the ZIP might add is unknown.
- Impact: Phase 20 marks ZIP-only items `NOT RUN / NOT VERIFIED`. If the ZIP arrives later, run a delta audit and update this file.

## D-02 — Category depth (conflict inside the prompt)
- Context: original business logic allows depth 0..2 (three levels); the student roadmap says two levels.
- Decision: **two levels total (root + child)**.
- Impact: validation, tests and docs all use max depth 1; a child cannot have children.

## D-03 — Checkout idempotency (conflict inside the prompt)
- Context: “retry with same key returns original” vs “second request after cart cleared returns 400 Cart is empty”.
- Decision: `Idempotency-Key` header, stored in an idempotency table with a payload hash and the resulting order id. Same key + same payload → original order. Same key + different payload → 409. New key after the cart is consumed → 400 `Cart is empty`.
- Impact: extra table; frontend keeps one key per checkout attempt via `useRef`.

## D-04 — Package manager
- Context: prompt prefers Bun, falls back to npm with an explanation.
- Decision: decided in Phase 3 after checking what is installed on the owner’s Windows machine; one package manager and one lockfile only.

## D-05 — Package versions
- Context: Prisma 7, NestJS 11, Next.js 16, Tailwind v4, Zod v4, TanStack Query v5.
- Decision: versions are verified from `package.json`/lockfiles in Phase 3–4; no commands from memory. Prisma 7 uses `prisma.config.ts` and `@prisma/adapter-pg`.

## D-06 — Cron interval
- Decision: one interval for both sweeps: **every minute** (timeout sweep and `REFUND_PENDING` retry), documented in code and README.

## D-07 — Audit log
- Context: “audit record if audit is included in the core implementation”; no audit model in the core table list.
- Decision: no audit table in core. Admin actions (customer status change, order status/cancel) are written to the application `Logger` with ids only. Audit table is `OPTIONAL — BACKLOG`.

## D-08 — Phone and barcode
- Decision: no `phone` and no `barcode` fields in core (register uses name, email, password).

## D-09 — User statistics
- Decision: `User` has `totalOrders` (int) and `totalSpent` (Decimal(10,2)), changed only by guarded payment/refund transitions.

## D-10 — QR-scan login (request from the owner, not in the prompt)
- Decision: classified `OPTIONAL — BACKLOG`, planned as an extra phase **after Phase 20**. Outline: `QrLoginSession` model (short TTL, status PENDING/APPROVED/EXPIRED), `POST /auth/qr/sessions`, `GET /auth/qr/sessions/:id` (polling), `POST /auth/qr/sessions/:id/approve` (needs an already signed-in device).
- Impact: until built, the Next.js login page shows only email login; the QR tab from the prototype is not shown as if it worked.

## D-11 — Frontend design is approved
- Decision: the arch-themed look of the prototype (wine-black, brass gold, ivory; nested arches, lantern light, letter wave, packaged-product cards, login with arch card) is kept. It is ported to Next.js 16 + Tailwind v4 tokens in Phases 14–16. Cursor circle is not used.
- Impact: the prototype `mirzas-place.html` is a visual reference only; it is not counted as any phase’s deliverable.

## D-12 — Brand name vs internal names
- Decision: customer-facing brand is **Mirza’s Natural Store**. Repository and folders keep the prompt’s names (`online-mart-student`, `student-api`, `student-web`).

## D-13 — Currency display
- Decision: DB stores `Decimal(10,2)` in major units; UI shows `Rs.` from one constant in `lib/config.ts`. No currency column in core.

## D-14 — Address field names
- Decision: DB/DTO names stay exactly as specified (`addressLine`, `city`, `county`, `postcode`). UI labels may be friendlier.

## D-15 — Mock completion path
- Decision: `POST /payments/:id/mock-complete` creates a signed event with `signEvent` and sends it through the same internal handler as the webhook, so there is one success/failure code path.

## D-16 — Webhook event names
- Decision: `payment.succeeded` and `payment.failed`.

## D-17 — Demo catalog
- Decision: sample categories/products/inventory (dates, saffron, honey, ghee, olive oil, pistachios, chai, coffee) come from an optional separate seed script, never from the admin seed, so the single-admin seed stays minimal.

## D-18 — Rate limits (initial policy)
- Decision: login/register 10/min/IP, payment 5/min, order create/cancel 20/min; other write routes get a moderate default. Revisit in Phase 19.

## D-19 — Product deletion
- Decision: no product delete endpoint in core; deactivate with `isActive=false`.

## D-20 — Payment arriving after the 5-minute window but before the cron sweep
- Decision: if the order is still `PENDING`, the payment confirms it (customer-friendly). If the order was already cancelled by the sweep, the payment becomes `REFUND_PENDING` and is refunded; the order is never revived.

## D-21 — Package manager
- Decision (D-04 resolved): scripts and README use **npm**. Bun was not verified on the owner's machine; `package.json` files stay Bun-compatible.

## D-22 — Services folder layout in the frontend
- Decision: each domain in `student-web/src/services/<domain>/` has `types.ts`, `index.ts` (API calls) and `hooks.ts` (TanStack Query queries and mutations together).

## D-23 — Dark theme only
- Decision: the Next.js port ships the dark luxury theme only (the prototype's light variant was dropped).
