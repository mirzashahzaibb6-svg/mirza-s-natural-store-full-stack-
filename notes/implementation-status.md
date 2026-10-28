# Implementation status

Status words: `NOT STARTED` · `IN PROGRESS` · `WRITTEN (not run)` · `VERIFIED` (only after the command was run and output seen).
**Nothing below is `VERIFIED`.** The code was written and syntax-checked (TypeScript parser) in a sandbox without internet, so `npm install`, database, tests and builds have not been executed.

## Phases

| # | Phase | Status | Exit criteria (short) |
|---|---|---|---|
| 1 | Requirements audit | DONE (files written) | requirements + decisions written, no code |
| 2 | Architecture and workflows | WRITTEN (not run) | diagrams, ERD, state machines match decisions |
| 3 | Workspace and environment | WRITTEN (not run) | installs work, Postgres health check, no secrets committed |
| 4 | Prisma 7 and database | WRITTEN (not run) | migration + seed work; 2nd admin and negative stock rejected |
| 5 | Shared backend foundations | WRITTEN (not run) | `/v1/health` 200; fails fast on bad env |
| 6 | Authentication and roles | WRITTEN (not run) | escalation, 401/403, deactivated-user tests pass |
| 7 | DTOs, types, mappers | WRITTEN (not run) | no raw Prisma output, no `passwordHash` |
| 8 | Categories and products | WRITTEN (not run) | catalog tests pass |
| 9 | Inventory and money | WRITTEN (not run) | stock/ledger tests pass |
| 10 | Addresses and cart | WRITTEN (not run) | ownership and cart edge-case tests pass |
| 11 | Order creation/query/cancel/status | WRITTEN (not run) | rollback, race, IDOR, transitions pass |
| 12 | Mock payment and cron | WRITTEN (not run) | webhook, late payment, refund retry, timeout pass |
| 13 | Backend completion and review | WRITTEN (not run) | all 41 routes; unit + e2e + lint + build pass |
| 14 | Frontend foundation (Next.js 16) | WRITTEN (not run) | builds; login/register connected |
| 15 | Zod forms and services/hooks | WRITTEN (not run) | schema/API wrapper tests pass |
| 16 | Customer experience | WRITTEN (not run) | register → order → mock payment works in browser |
| 17 | Admin experience | WRITTEN (not run) | admin-only pages and flows work |
| 18 | UX states, responsive, a11y | WRITTEN (not run) | no blank/crashed screen offline or on 403 |
| 19 | Security, concurrency, verification | PARTLY WRITTEN (tests written, never run) | Section 9 tests pass, failures documented |
| 20 | Final acceptance and documentation | NOT RUN — see checklist in README | checklist with PASS / FAIL / NOT RUN and evidence |

## Frontend prototype
`docs/design-prototype/mirzas-natural-store-prototype.html` is the approved visual reference (D-11). Its design is ported into `student-web` (arches hero, lantern light, packaged products, arch login card).

## Optional backlog
All `NOT IMPLEMENTED / OPTIONAL`:
1. Brands and suppliers
2. Images and uploads (magic-bytes validation)
3. Allergens
4. Batch inventory, expiry, FEFO
5. Stripe test mode
6. Bull/Redis queues
7. R2/S3 uploads
8. SMTP2GO emails
9. SSE / in-app notifications
10. Verified-purchase reviews
11. Admin dashboard / CSV export
12. Audit log
13. Profile update / anonymization
14. Multi-instance scaling
15. **QR-scan login** (owner request, D-10) — planned after Phase 20

## Open items
- Docs ZIP not supplied (D-01).
- Package manager and exact versions decided in Phase 3 (D-04, D-05).

## Known gaps / risks to check first
- Prisma 7 specifics (`prisma.config.ts`, `prisma-client` generator, `moduleFormat = "cjs"`, driver adapter) were written from documentation memory and are the most likely place for a first-run error.
- The init migration is generated on your machine by `npm run db:init`; constraints are appended automatically (`prisma/constraints.sql`).
- Frontend has no component tests yet (only `request()` and Zod schema tests).
- QR login not implemented (D-10).
