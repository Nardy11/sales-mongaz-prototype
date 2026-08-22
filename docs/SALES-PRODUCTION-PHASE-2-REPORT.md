# Sales Production — Phase 2 Report

## Status

**Status: STILL PARTIAL.** Phase 2 adds the Sales Representative vertical slice only. It builds on the existing Customer and Commitment domains; no Phase 3 role workspace was added.

## Domains, migrations, and APIs

- `003_phase2_representative_vertical.sql` adds persisted products, visits, opportunities, internal order requests/items, collection outcomes/payment promises, complaints, and market observations.
- Visits have explicit planned, in-progress, completed, and cancelled states. Completion requires outcome and evidence.
- The API adds representative-only daily work, visit create/start/complete, order request capture, opportunities, collections/payment promises, complaints, and market observations.
- Orders begin at the canonical internal `recorded` state. Product and positive quantity are mandatory; a recent same-customer/item request returns a duplicate warning unless explicitly overridden.
- Payment promises, complaints, opportunities, and visit outcomes can create linked Phase 1 commitments. Complaint recording begins in `recorded`; it is never implicitly resolved.

## Representative workflow and reporting

- The production representative route now loads persisted daily visits and commitments, starts visits, records an outcome/evidence pair, and refreshes the live rail after completion. Its progressive optional capture exposes order/request, collection/payment promise, complaint, opportunity/cross-sell, and market observation recording against the production APIs.
- It preserves the Artifact 1 task-first navy hero, compact ledger rows, rail, Arabic RTL, mobile-first primary actions, and derived Close My Day figures (planned/completed visits and open commitments). Metrics without a legitimate persisted dependency are not fabricated.
- `api/db/seed-phase2.ts` creates clearly labelled DEVELOPMENT/TEST product, planned visit, and market evidence.

## Authorization, audit, and integrity

- All Phase 2 write/read APIs require an authenticated Sales Representative role, CSRF proof for writes, and backend customer/visit ownership checks.
- Important changes are recorded through the established audit foundation: planned/started/completed visits, order recording, and each operational capture. Multi-record visit and order operations use database transactions.
- Phase 0–1 API tests, runtime integrity, TypeScript build, and frozen artifact/AFDF hash validation passed before Phase 2 work. Artifacts 0–5 and the AFDF design package remain unchanged.

## Deferred

Telesales, Supervisor, Manager workspaces, coaching/exception decisions, notifications, configuration UI, and cross-role reporting remain deferred to Phase 3+ authorization.

## Remaining Phase 2 acceptance gaps

- Reactivation now has a server-authoritative endpoint that checks inactive customer scope, creates a Phase 1 Commitment with evidence/due point, retains inactive state, and audits the action. Its dedicated Customer Operating File UI action remains outstanding.
- The daily API now derives persisted visit, customer, order/value, collection/amount, promise/amount, complaint, opportunity, observation, reactivation, open-follow-up, and carried-forward figures. The rendered Close My Day ledger still needs to expose the complete evidence breakdown.
- Comprehensive Phase 2 API/domain/transaction/E2E coverage remains outstanding. Existing Phase 0–1 tests, build, Sites tests, and protected-runtime checks pass.
- Clean PostgreSQL acceptance could not run because the previously used local Docker container `sales-phase1-postgres-check` no longer exists; migration/seed acceptance requires a provisioned fresh PostgreSQL environment. `api:seed-phase2` also needs to be added as a package script before the commanded verification can run.

## Close My Day completion pass

- Close My Day now renders a compact, expandable Operating Ledger directly from the existing representative daily endpoint: planned/completed visits, customers visited, visit outcomes, orders and stored order value, collections and stored collected amount, promises and stored promise amount, complaints, opportunities, observations, reactivation work, open follow-ups, and carried work.
- Inspection controls reuse the existing ledger row/status vocabulary. They explicitly identify the underlying persisted day records as the source; no daily-summary table or client-maintained totals were added.
- `api:seed-phase2` is now registered for the existing development seed. Overall status remains **STILL PARTIAL** pending the separate acceptance-test and clean-PostgreSQL tasks.
- `npm run build` and `npm run check:runtime` passed after this focused change. No Phase 3 or unrelated Phase 2 work was performed.

## Acceptance-test pass status

- Executed baseline: API tests 3/3 passed, Playwright runtime/Phase 0 tests 9/9 passed, Sites tests 4/4 passed, build and protected-runtime integrity passed.
- Clean database exercise executed successfully in a disposable `postgres:16-alpine` container: migrations 001–003, Phase 0 bootstrap, Phase 1 seed, and the registered `api:seed-phase2` all completed. An authenticated representative retrieved the persisted daily visit, commitments, Close My Day derivation, and market observation. The disposable container was removed afterward.
- The comprehensive Phase 2 API/domain/transaction/frontend acceptance suite remains outstanding; this pass did not represent those tests as passing.

## API/domain test batch 1

- Added `api/tests/phase2-postgres.pg.ts` and `npm run test:api:phase2`. The explicit PostgreSQL suite asserts persisted visit lifecycle/start/complete/repeat rejection/audit; order/item persistence, recorded lifecycle, duplicate warning and override; payment-promise plus Phase 1 Commitment; complaint recorded-state semantics; opportunity and market-observation persistence; and inactive-customer reactivation without activation/classification/status mutation.
- The tests use the production `RepresentativeService`, `CustomerCommitmentService`, PostgreSQL identity repository, audit service, and direct persisted-row assertions. They intentionally require `DATABASE_URL` and are excluded from the existing in-memory Phase 0–1 command.
- Executed in this batch: `npm run build` passed and `npm run test:api` passed 3/3. PostgreSQL-dependent Batch 1 execution is **IMPLEMENTED — EXECUTION PENDING POSTGRESQL** in this task; frontend/E2E coverage remains outside this batch.

## Frontend/E2E test batch 2

- Added `tests/phase2-representative.spec.ts` and `npm run test:e2e:phase2`. The fixture-based browser tests exercise actual production routes/components with API-contract fixtures, not frozen artifact JSX and not database persistence claims.
- Covered representative authentication/route, RTL, mobile workspace ledger, planned → in-progress → completed visit with required outcome/evidence fields, refreshed persisted-state rendering, Commitment Rail, and all rendered Close My Day ledger categories.
- Covered the Customer Operating File inactive state, reactivation evidence/due-point capture, persisted API response refresh, new Commitment display, and the invariant that the customer still renders inactive.
- Executed: `npm run test:e2e:phase2` 2/2 passed; `npm run build` and `npm run check:runtime` passed. No production defect was discovered or fixed in this batch. Frozen artifacts and AFDF were untouched.
