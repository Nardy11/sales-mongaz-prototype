# Sales Production — Phase 6 Manager Slice Report

Status: **COMPLETE — PHASE 6 FINAL ACCEPTANCE PASSED**

This report records the authorized Manager vertical slice only. The earlier
implementation-ready state is superseded by the independent final acceptance
recorded below.

## Delivered scope

- Persisted Manager priorities with reason, recorded source evidence, owner,
  due point, urgency, explicit success condition, status, and optimistic
  version.
- Persisted Manager decisions with actor, evidence, optional resulting
  follow-up, and explicit resolution record.
- Manager review read model combining Manager-owned decision records with the
  canonical, organization-scoped Supervisor exception evidence. It does not
  copy calls, customers, orders, complaints, or Supervisor records.
- Manager route/API for the review workspace, priority creation, and recorded
  decision / explicit priority resolution.
- Arabic RTL production Manager workspace, including evidence-first priority
  detail, success condition, canonical exception visibility, open/actioned/
  resolved semantics, persisted resulting-Commitment display, loading, empty,
  retryable error, and narrow mobile behavior.

## Schema and domain behavior

Migration `007_phase6_manager.sql` adds `manager_priorities` and
`manager_decisions`. A priority is `open`, `actioned`, `resolved`, or
`cancelled`; `operationallyOpen` remains true for `open` and `actioned`.

A recorded Manager `decision` requires evidence and a due point, then invokes
the canonical `CustomerCommitmentService` inside the same transaction. The
resulting Commitment is source-linked to `manager_priority`. A decision is not
completion and does not mutate the referenced canonical source work. Explicit
priority resolution requires evidence and is recorded separately.

The write transaction includes the priority update, decision record, canonical
Commitment where applicable, and audit event. Version comparison prevents stale
updates; idempotency keys protect priority creation and canonical follow-up
creation. A failed canonical Commitment insert rolls back all Manager writes
and success audit records.

## Authorization boundaries

- The API and service require the `sales_manager` role.
- The active Manager must belong to the authenticated organization.
- Manager workspace and priorities are filtered by organization server-side.
- Canonical Commitment ownership validation remains in the canonical
  Commitment service. No raw Commitment insert was added to Manager code.

## Validation and test evidence

Focused disposable PostgreSQL 16 validation applied migrations `001`–`007`,
then Phase 0 bootstrap and Phase 1–6 DEVELOPMENT/TEST seeds. Dedicated Manager
PostgreSQL/API tests passed **6/6**:

- organization/role denial and canonical evidence visibility;
- decision → canonical Commitment → actioned-but-open priority;
- explicit priority resolution;
- forced Commitment failure rollback/no audit residue;
- retry-safe single decision/Commitment persistence.
- authenticated Manager API route and CSRF enforcement.

Dedicated production-route UI-contract tests passed **6/6**:

- Arabic RTL canonical review and success-condition rendering;
- evidence validation and mutation → refetch → persisted Commitment evidence;
- explicit completion distinct from actioned/open work;
- loading and narrow mobile behavior;
- retryable error without fabricated evidence;
- empty workspace without fabricated work.

`npm run build` and `npm run check:runtime` pass. The runtime integrity check
continues to report all 28 protected files intact.

## Finding corrected during implementation

A focused PostgreSQL test found an ambiguous unqualified `id` in the Manager
workspace's canonical Supervisor-exception query. The minimal correction
qualified the selected and ordered exception columns with `x`. The dedicated
suite was rerun clean afterward. No other P0/P1 production defect was found in
this implementation pass.

## Integrity

Frozen Artifact 0–5 hashes remain the approved values:

| Artifact | SHA-256 |
| --- | --- |
| 0 | `B2C1B82B5A89484C8AE4463E5A6472305CF0311BC70CA76A3807B0DDAD1A64FC` |
| 1 | `225359F10F52C35CD69A8C0B842A89353BED55E4A6D4DCE93832D8219CE12E56` |
| 2 | `F859D24412DC83282854302FA417080BB540F7CE6212F7FF033935B91A4061FA` |
| 3 | `61739E42EA6C3F43FD91AA985CD4AA71B15AF0DC9FF6A7E917C37B6DDAA55E87` |
| 4 | `527907D1F09B4884FC392B6546813A226E1784807B4489B81003C15D3ABB3F1C` |
| 5 | `0F86E393D8348603CBE62A0AB50FD734B09BB2D5B25F03423BCFE5DBE808855E` |

AFDF remains the approved SHA-256:
`06375A3A5432D03E8F7B09D3D4841E7FB57010A8D6CA4021B09FC92444424C3D`.

## Deferred scope

This smallest authorized slice intentionally does not implement Phase 7 or
external integrations. Manager development-action workflows, reporting/KPI
views, and broad customer/report drill-down remain unimplemented pending their
explicitly scoped Phase 6 continuation or final-acceptance direction. No
telephony, ERP, SoftX, EES, accounting, warehouse, transport, or external
synchronization was introduced.

## Independent final acceptance — passed

A new disposable PostgreSQL 16 database, `sales-phase6-final-acceptance`, was
created and used only for this acceptance. Migrations `001`–`007`, Phase 0
bootstrap, and Phase 1–6 DEVELOPMENT/TEST seeds all passed in canonical order.

| Gate | Result |
| --- | --- |
| Phase 0 API | 3/3 passed |
| Phase 2 PostgreSQL | 5/5 passed |
| Phase 3 PostgreSQL | 11/11 passed |
| Phase 4 PostgreSQL | 20/20 passed |
| Phase 5 PostgreSQL | 13/13 passed |
| Phase 6 PostgreSQL/API | 8/8 passed |
| Phase 2 E2E | 2/2 passed |
| Phase 3 E2E | 7/7 passed |
| Phase 4 E2E | 7/7 passed |
| Phase 5 E2E | 10/10 passed |
| Phase 6 E2E | 6/6 passed |
| Full runtime | 42/42 passed |
| Sites | 4/4 passed |
| Production build / protected runtime | passed / 28 protected files intact |

Acceptance strengthened the Manager PostgreSQL suite with source/customer
organization isolation, inactive Manager denial, stale/repeated transition
rejection, and proof that a Manager decision does not mutate the referenced
canonical Supervisor source. The Manager E2E suite independently verifies RTL,
mobile, evidence-before-action, validation, explicit completion, loading,
empty, retry/error, and mutation → refetch → persisted consequence.

Two findings were corrected during acceptance:

1. The Manager exception read query used an ambiguous unqualified `id` after
   joins. The selected/ordered exception columns are now explicitly qualified.
2. Priority creation validated its owner but did not validate supplied customer
   or canonical Supervisor-exception source organization. It now rejects
   foreign customer/source inputs server-side before persistence.

Both were genuine P1 production defects, received narrow corrections and
targeted regressions, and the complete matrix above was then clean. No P0/P1,
P2, or P3 finding remains for this authorized slice.

The frozen Artifact 0–5 hashes were recalculated and match the approved record.
`docs/sales-afdf-design-package.md` was recalculated as
`06375A3A5432D03E8F7B09D3D4841E7FB57010A8D6CA4021B09FC92444424C3D`.
No Phase 7, telephony, ERP/SoftX/EES, accounting, warehouse, transport,
external synchronization, or parallel operational domain was introduced. The
deferred Manager reporting/KPI and broader drill-down scope remains deliberately
unimplemented.
