# Sales Production Phase 0 Report

**Status:** Phase 0 production foundation implemented.  
**Scope boundary:** No Phase 1+ Sales business feature was implemented.

## Architecture implemented

- Existing React 19 + TypeScript + Vite frontend retained inside the protected mobile runtime.
- Production composition now starts at `src/app/ProductionApp.tsx`; legacy prototype source remains retained as `LegacyPrototype` and is not deleted.
- React Router establishes `/login` and protected placeholder routes for Sales Representative, Telesales Employee, Telesales Supervisor, and Sales Manager.
- `src/design-system/` contains the shared frozen Design DNA primitives; `src/lib/api.ts` is the frontend API boundary.
- `api/` is a standalone TypeScript Fastify modular-monolith foundation. It has no customer, order, visit, call, complaint, collection, priority, or reporting endpoint.

## Dependencies added

| Dependency | Purpose |
| --- | --- |
| `react-router` | Production URL routing and protected route boundaries. |
| `fastify` | Standalone TypeScript API foundation. |
| `@fastify/cookie`, `@fastify/cors`, `@fastify/rate-limit` | Cookie sessions, local web/API boundary, and login-rate limiting. |
| `argon2` | Argon2id password hashing. |
| `postgres` | PostgreSQL migration and repository foundation. |
| `zod` | API validation foundation. |
| `tsx`, `@types/node` | TypeScript API/migration/test execution. |

Tailwind was intentionally not introduced: the protected Vite runtime configuration would need modification solely for styling tooling. The implemented production CSS token layer is the smallest compatible solution and preserves the frozen visual contract.

## Files/modules created or changed

- `src/app/ProductionApp.tsx`, `src/app/production.css` — RTL root, login route, authenticated role placeholders, frozen shell styling.
- `src/design-system/foundation.tsx` — status labels, next-action hero, Commitment Rail/node vocabulary, ledger row, lifecycle mini-rail, state panels.
- `src/lib/api.ts` — typed frontend API/session boundary.
- `api/src/` — Fastify bootstrap, auth/session/CSRF/policy, audit service, repository interfaces and PostgreSQL repository.
- `api/db/migrations/001_phase0_identity.sql` — organization, team, employee, role, session, and audit foundations.
- `api/db/migrate.ts`, `api/db/bootstrap.ts` — repeatable migration and local bootstrap commands.
- `api/tests/foundation.test.ts`, `tests/phase0-app.spec.ts` — API and frontend foundation coverage.
- `package.json` / lockfile — Phase 0 commands and dependencies.

## Database foundation

The migration defines only Phase 0 identity/security/audit structures: organizations, teams, employees, four-role enum, server sessions, and audit events. It does not create any Sales business entities.

Migration was executed on a temporary local PostgreSQL 16 container. `001_phase0_identity.sql` applied successfully; the five foundational tables were verified. A local bootstrap employee account was created through `api:bootstrap`, then the API ran against PostgreSQL and successfully completed health, login, and session lookup. The temporary container was stopped after verification.

## Authentication/session and authorization

- Local employee accounts; Argon2id hashing.
- Server-side session records, HttpOnly / SameSite=Strict cookies, expiry, revocation, and session creation audit.
- CSRF token is returned only after login and its hash is stored in the session record; state-changing logout requires the token.
- Login has basic rate limiting.
- Backend `requireAuth` and `requireRole` enforce access; frontend guards route for UX only.
- Four supported roles are `sales_representative`, `telesales_employee`, `telesales_supervisor`, and `sales_manager`. No fifth operational workspace was created.

## Audit foundation

The audit boundary records actor, action, resource type/ID, before/after payloads where permitted, reason, correlation ID, and timestamp. Phase 0 records session creation/revocation. It is audit logging, not event sourcing.

## Frozen Design DNA foundation

Implemented reusable, RTL-aware primitives directly from the frozen Operating Ledger: warm canvas, navy decision surface, blue action colour, brass accent, semantic status colours, compact rule-based density, next-action hero, Commitment Rail/rail nodes, ledger row, lifecycle mini-rail, and loading/empty/error/permission states. The four role routes intentionally remain minimal structural placeholders.

## Validation results

- Frozen Artifacts 0–5 SHA-256: verified against the freeze record before and after Phase 0 work.
- AFDF baseline SHA-256: verified unchanged.
- `npm run check:runtime`: passed.
- `npm run build`: passed.
- `npm run test:api`: 2/2 passed (health, session lifecycle, audit, role denial, CSRF denial).
- `npm run test:runtime`: 9/9 passed (including Phase 0 app boot/RTL/protected-route check and protected keyboard/sheet runtime regression).
- `npm run test:sites`: 4/4 passed.
- Actual PostgreSQL migration/bootstrap/API-session smoke test: passed locally.

## Deviations and deferred work

- No production cloud host was selected or provisioned.
- Tailwind was not added because it would require an unnecessary protected Vite configuration change; CSS tokens preserve the frozen result.
- A temporary in-memory repository remains available for isolated API tests and no-database local API startup. `DATABASE_URL` selects the PostgreSQL repository for persistent sessions/audit in the intended environment.
- Customer, commitments, visits, calls, orders, collections, complaints, opportunities, observations, coaching, priorities, KPI reporting, configuration UI, notifications, and all Phase 1+ business work remain deferred.

## Integrity and stop boundary

Frozen Artifacts 0–5 and AFDF were not modified. Protected mobile runtime files were not modified. This work ends at Phase 0; no Phase 1 Customer + Commitment Core or later functionality has been started.
