# Sales Production — Phase 1 Report

## Status

Phase 1 implements the persistent Customer and Commitment / Follow-up vertical slice only. No Phase 2 workflow was added.

## Domain and database

- `002_phase1_customer_commitment.sql` adds `customers` and `commitments`, controlled classification/status/urgency types, foreign keys to the existing organization/team/employee foundation, lifecycle checks, optimistic versions, idempotency protection, self-reference for the resulting commitment, and operational indexes.
- Customer classification (`gold`, `silver`, `follow_up`), operational status (`normal`, `attention`, `risk`), and active state are separate fields.
- Commitment states are `open`, `completed`, and `cancelled`; overdue is derived from an open due point. Completion requires evidence at database level and may create one linked next commitment.

## API and authorization

- Customers: `GET /api/customers`, `GET /api/customers/:id`, `POST /api/customers`, and `PATCH /api/customers/:id`.
- Commitments: `POST /api/commitments` and `POST /api/commitments/:id/complete`.
- Validation uses Zod; write endpoints require the Phase 0 session and CSRF proof.
- Scope is evaluated server-side: representative/telesales ownership, supervisor team scope, and manager organizational scope. Inaccessible customer and commitment resources return no usable data.
- Completion is guarded by the lifecycle state and returns `409` when repeated. Creation supports a per-owner idempotency key.

## UI

- The Sales Representative production route now loads the persisted customer register and opens a real Customer Operating File.
- The file shows customer identity, classification/status context, active state, operational notes, and a persisted Commitment Rail. Rail nodes express current/open, overdue, completed evidence, owner context through the stored commitment, and resulting commitment linkage.
- Loading, retryable error, empty, denied, Arabic RTL, responsive customer-file spacing, focus-visible controls, and non-color status labels are implemented for the Phase 1 surfaces.
- Future-domain sections are intentionally not fabricated.

## Audit and development data

- Customer creation, meaningful updates, ownership changes, active-state changes, and commitment creation/completion/resulting-creation are recorded with the Phase 0 audit foundation. No configuration UI was introduced.
- `api/db/seed-phase1.ts` creates clearly marked DEVELOPMENT/TEST data: active/inactive customers, all three customer classifications, open/overdue/completed commitments, and a completed commitment with a resulting follow-up.

## Validation

- `npm run check:runtime` passed: 28 protected runtime files.
- `npm run test:api` passed: Phase 0 auth/session/CSRF/role tests and Phase 1 overdue derivation test.
- A clean local PostgreSQL Phase 0 database accepted migrations `001` and `002`, bootstrap, and the Phase 1 development seed.
- Live API validation passed for authenticated persisted customer list/detail, commitment completion with evidence and resulting follow-up creation, and repeated completion rejection (`409`).
- `npm run build` and `npm run test:sites` passed.

## Design fidelity and integrity

- The customer ledger, compact operating-file hierarchy, restrained attention treatment, navy/blue/brass language, Arabic RTL, and shared Commitment Rail follow frozen Artifacts 0 and 2 without copying prototype-local state.
- Artifact hashes and the AFDF baseline were rechecked after implementation and remain unchanged.

| Asset | SHA-256 |
| --- | --- |
| Artifact 0 | `B2C1B82B5A89484C8AE4463E5A6472305CF0311BC70CA76A3807B0DDAD1A64FC` |
| Artifact 1 | `225359F10F52C35CD69A8C0B842A89353BED55E4A6D4DCE93832D8219CE12E56` |
| Artifact 2 | `F859D24412DC83282854302FA417080BB540F7CE6212F7FF033935B91A4061FA` |
| Artifact 3 | `61739E42EA6C3F43FD91AA985CD4AA71B15AF0DC9FF6A7E917C37B6DDAA55E87` |
| Artifact 4 | `527907D1F09B4884FC392B6546813A226E1784807B4489B81003C15D3ABB3F1C` |
| Artifact 5 | `0F86E393D8348603CBE62A0AB50FD734B09BB2D5B25F03423BCFE5DBE808855E` |
| AFDF design package | `06375A3A5432D03E8F7B09D3D4841E7FB57010A8D6CA4021B09FC92444424C3D` |

## Deferred work

Visits, telesales calls, orders, collections/payment promises, complaints, opportunities, market observations, Supervisor and Manager workflows, reporting/KPIs, notifications, and configuration UI remain deferred to authorized later phases.

## Deviations / blockers

No blocker or design deviation was identified. The Phase 1 scope exposes only the necessary write API boundary; it does not add a premature customer/commitment maintenance UI.
