# Sales Production Phase 5 Report

## Status

**COMPLETE**. The historical partial and failed acceptance attempts below are superseded by the successful independent final acceptance rerun on 2026-08-22.

## Domain and schema

- Migration 006 adds only Supervisor-owned persistence: scoped source-linked exceptions, action/intervention evidence, morning/midday/end-of-day checkpoints, quality reviews, and coaching records.
- Existing customers, calls, orders, complaints, and Commitments remain canonical. Supervisor records link to their source rather than duplicate them.
- Mutable exceptions/coaching records use optimistic versions. Every persisted record carries organization/team scope, actor, evidence, timestamps, and audit linkage.

## Open versus resolved invariant

- Exception status is `open`, `actioned`, or `resolved`; `operationallyOpen` is true unless status is `resolved`.
- Acknowledge, escalation, reassignment, and follow-up persist action evidence but leave the underlying exception open. Only explicit `resolve` records genuine resolution.
- Quality review and coaching do not resolve their source work.

## Supervisor operations

- `SupervisorService` exposes a team-scoped workspace read model for readiness, checkpoint evidence, exception detail/history, team execution, quality review, and coaching.
- Supervisor action, quality review, coaching, and checkpoint API routes require authenticated Telesales Supervisor role and CSRF for writes.
- Same-team Supervisor follow-up creation uses `CustomerCommitmentService` transaction APIs. Action/coaching + canonical Commitment + audit are atomic; no raw Commitment SQL is used by the service.

## Seed and UI

- `api:seed-phase5` creates clearly labelled DEVELOPMENT/TEST Supervisor, team, persisted checkpoint, open/actioned/resolved exception, escalation, quality, coaching, and overdue coaching-follow-up scenarios.
- The production Supervisor route renders Artifact 3’s compact Arabic RTL operating-ledger hierarchy: next action, three checkpoints, source evidence, exception queue/detail, team readiness, quality, coaching, and explicit open/actioned/resolved labels.
- No Manager workspace or strategic-priority function was introduced.

## Validation

- Phase 5 PostgreSQL suite: 8/8 passed, including forced dependent-write rollback/no-residue coverage.
- Phase 5 fixture-backed E2E UI-contract suite: 4/4 passed.
- Regressions: Phase 0 API 3/3; Phase 2 PostgreSQL 5/5; Phase 3 PostgreSQL 11/11; Phase 4 PostgreSQL 20/20; Phase 2 E2E 2/2; Phase 3 E2E 7/7; Phase 4 E2E 7/7.
- Full runtime suite 30/30, Sites 4/4, production build, and protected mobile-runtime integrity (28 files) pass.

## Integrity and scope

- Frozen Artifacts 0–5 and AFDF are not modified. The required AFDF hash remains `06375A3A5432D03E8F7B09D3D4841E7FB57010A8D6CA4021B09FC92444424C3D`.
- No Manager/Phase 6, telephony, ERP/SoftX/EES, accounting, warehouse, transport, or other external integration work was added.

## Independent final acceptance — 2026-08-22

**Status: FAILED / P1 acceptance-evidence gap.** A new disposable PostgreSQL 16 environment successfully applied migrations 001–006, completed bootstrap plus Phase 1–5 seeds, and was removed. Fresh suites passed: API 3/3, Phase 2 PostgreSQL 5/5, Phase 3 PostgreSQL 11/11, Phase 4 PostgreSQL 20/20, Phase 5 PostgreSQL 8/8; Phase 2 E2E 2/2, Phase 3 E2E 7/7, Phase 4 E2E 7/7, Phase 5 E2E 4/4; runtime 30/30; Sites 4/4; build and 28-file protected-runtime integrity.

The acceptance does not pass despite those green results. The independent coverage audit found that `api/tests/phase5-supervisor.pg.ts` does not separately prove acknowledgement and reassignment still-open behavior, authenticated HTTP/CSRF denials, foreign-team Commitment denial, or valid-retry-exactly-once behavior. `tests/phase5-supervisor.spec.ts` does not provide sufficient mobile/narrow rendered evidence, intentional loading/empty state coverage, or quality/coaching and persisted follow-up consequence coverage. These are P1 acceptance-evidence gaps under the Phase 5 authorization contract. Frozen Artifact 0–5 and AFDF hashes remain approved; no Manager/Phase 6 or external-integration scope was introduced.

## E2E evidence-gap closure attempt — 2026-08-22

**Status: STOPPED / P1 production defect.** The strengthened rendered quality-review scenario returns persisted `quality.evidence` through the production API contract but the Supervisor workspace renders only the observation/result. The required source evidence is therefore absent from the actual UI, violating Artifact 3’s evidence-before-action quality-review contract. The test fails deterministically at `tests/phase5-supervisor.spec.ts` on `TEST review evidence`; no production code was changed in this evidence-only pass.

## Quality-review P1 correction / E2E closure resume — 2026-08-22

The quality-review root cause was confirmed end-to-end: `SupervisorService`, the API type, and the workspace payload preserved `quality.evidence`, while `SupervisorWorkspace` omitted it from the existing ledger row. The minimal correction changed only `src/features/supervisor/SupervisorWorkspace.tsx` to render the persisted evidence together with the existing observation. The targeted quality regression now passes.

**Status: STOPPED / new P1 production defect.** The next independently added coaching read-contract scenario deterministically fails because persisted `coaching.evidence` is also present in the workspace payload but omitted from the rendered Commitment Rail. The failure is at `tests/phase5-supervisor.spec.ts` on fixture value `proof`. This is a second evidence-before-action defect and requires separately authorized correction before the remaining E2E expansion or final acceptance can continue.

## Coaching-evidence P1 correction / E2E closure resume — 2026-08-22

The coaching root cause was confirmed through the full read path: the persisted coaching record is selected by `SupervisorService.workspace`, `coaching.evidence` is retained by the API/read model and `SupervisorWorkspace` type, but the existing Commitment Rail rendered only the agreed action. The narrow production correction in `src/features/supervisor/SupervisorWorkspace.tsx` keeps the same rail and renders employee plus topic as its title, with the actual persisted evidence before the agreed action and visible coaching status in the existing metadata line. The due point remains the rail time. No schema, service, authorization, exception-state, Commitment-lifecycle, or Supervisor-action behavior changed.

Targeted regressions pass: coaching evidence/employee/topic/action/due/status/open-source-work 1/1; previously corrected quality evidence/result/observation/open-source-work 1/1. The pre-expansion Phase 5 E2E suite passed 6/6. Added fixture-backed contract scenarios also pass for accepted narrow mobile (427×952), intentional loading without fabricated evidence, authenticated empty state without fabricated work, and retryable error followed by an actual successful refetch. The retry fixture was adjusted to exhaust TanStack Query's automatic retries before exercising the deliberate retry control; this was a test-fixture correction only.

**Status: STOPPED / new P1 production defect.** The mandatory persisted follow-up/refetch scenario performs a successful Supervisor follow-up action, confirms a second `/api/supervisor/workspace` request, and returns an actioned-but-operationally-open exception containing `priorActionEvidence: "TEST persisted intervention evidence"`, a due point, and the canonical resulting-follow-up label. The UI does not render `priorActionEvidence` (nor an explicit resulting Commitment linkage) after that refetch, so the expected evidence is absent while the source remains open. This is a separate evidence-before-action/read-consequence P1 production defect, not a fixture failure. Per the stop rule, no further E2E scenarios, PostgreSQL regression, runtime/Sites/build checks, or final acceptance rerun were executed. Phase 5 remains not complete; Phase 6/Manager work was not started.

## Supervisor follow-up consequence P1 correction / E2E evidence closure — 2026-08-22

The follow-up read-path trace established that `supervisor_actions` persists `kind`, `evidence`, `follow_up_at`, `resulting_commitment_id`, actor, and the `resolves_work` invariant. `SupervisorService.action` creates resulting work through `CustomerCommitmentService` in the same transaction, stores the resulting canonical Commitment ID on the action, and retains the exception as `actioned`/operationally open unless the action is explicit `resolve`. The workspace API already returned `priorActionEvidence` and `followUpAt`, but discarded `resulting_commitment_id` and did not join the canonical Commitment read fields. The due point comes from the persisted Supervisor action and agrees with the linked Commitment due point.

The minimum correction changes `api/src/supervisor.ts` to expose the latest action actor and a read-only `resultingCommitment` projection containing the persisted canonical Commitment ID only. This intentionally does not query the Commitment table from `SupervisorService`; the resulting work is identified by its canonical linkage while its due point remains the persisted Supervisor-action due point. No follow-up table, duplicated domain state, raw Commitment SQL, authorization, team scope, optimistic version, audit, source linkage, or resolution behavior changed. `src/lib/api.ts` models that linkage, and `src/features/supervisor/SupervisorWorkspace.tsx` uses the existing exception-detail Operating Ledger and Commitment Rail to render action kind, actual persisted intervention evidence, actor, action due point, explicit canonical Commitment linkage, and still-open status.

Targeted action/refetch regression: 1/1 passed. It proves open/no-evidence/no-result before action; successful Supervisor follow-up mutation; a new workspace request; then actioned-but-operationally-open state, persisted intervention evidence, actor, due point, canonical resulting Commitment rail, and absence of resolved state. Quality evidence regression: 1/1 passed. Coaching evidence regression: 1/1 passed. The complete Phase 5 E2E suite passes 10/10, including RTL, checkpoint evidence, exception detail/open-actioned-resolved distinction, narrow mobile, loading, authenticated empty state, retry/recovery, and the persisted follow-up/refetch consequence.

Fresh disposable PostgreSQL 16 validation applied migrations 001–006, completed Phase 0 bootstrap and Phase 1–5 DEVELOPMENT/TEST seeds, then passed the strengthened Phase 5 PostgreSQL suite 13/13. This includes acknowledgement/reassignment still-open behavior, foreign-team Commitment denial, authenticated/CSRF write controls, rollback/no-residue, and valid retry exactly once. The disposable `sales-phase5-followup` container was removed after validation. The full runtime suite passes 36/36, Sites passes 4/4, the production build passes, and `check:runtime` confirms all 28 protected files. Frozen Artifacts 0–5 match the approved SHA-256 record and AFDF remains `06375A3A5432D03E8F7B09D3D4841E7FB57010A8D6CA4021B09FC92444424C3D`.

**Status: E2E EVIDENCE GAP CLOSED / READY FOR FINAL ACCEPTANCE RERUN.** No additional P0/P1 defect was found in this correction pass. Phase 5 is not marked complete, and Phase 6/Manager work was not started.

## Independent final acceptance rerun — 2026-08-22

**Status: COMPLETE.** This independent acceptance used a new disposable PostgreSQL 16 database, applied migrations 001–006, completed the Phase 0 bootstrap and all Phase 1–5 DEVELOPMENT/TEST seeds, then removed the disposable `sales-phase5-final-acceptance` container. The complete fresh API/PostgreSQL matrix passed: Phase 0 API 3/3; Phase 2 PostgreSQL 5/5; Phase 3 PostgreSQL 11/11; Phase 4 PostgreSQL 20/20; Phase 5 PostgreSQL 13/13.

The complete E2E matrix passed: Phase 2 2/2; Phase 3 7/7; Phase 4 7/7; Phase 5 10/10. The independently reviewed Phase 5 scenarios cover Arabic RTL, the accepted narrow mobile viewport, Supervisor-only workspace, all three checkpoints, team readiness, exception queue/detail and source evidence, open/actioned-but-open/resolved distinctions, persisted quality evidence/result/observation, persisted coaching employee/topic/evidence/action/due/status, loading, authenticated empty, retry/refetch, and successful follow-up mutation followed by a new workspace request. That post-mutation state visibly retains the persisted intervention evidence, actor context, due point, canonical resulting Commitment ID linkage, operationally-open state, and no false resolved/closed state.

Production review confirms `open` and `actioned` map to `operationallyOpen=true`, while only `resolved` maps false. Acknowledge, escalation, reassignment, follow-up, quality review, coaching, and canonical Commitment creation do not resolve source work; only explicit `resolve` does. Follow-up and coaching use `CustomerCommitmentService` inside the Supervisor transaction; there is no raw Commitment SQL in `SupervisorService`, no duplicate Supervisor follow-up domain, and the persisted action retains the canonical Commitment ID/source linkage. The strengthened API suite proves scoped authorization, authenticated active Supervisor enforcement, foreign-team/unsupported-role denial, CSRF enforcement, forced rollback/no residue, and exactly-once retry behavior.

Runtime/delivery gates pass: runtime 36/36, Sites 4/4, TypeScript/Vite production build, and `check:runtime` with all 28 protected files including `mobile-runtime.lock.json` and the authorized Keyboard correction. Frozen Artifacts 0–5 exactly match the approved SHA-256 record. AFDF exactly matches `06375A3A5432D03E8F7B09D3D4841E7FB57010A8D6CA4021B09FC92444424C3D`. Scope remains Supervisor-only: no Manager/Phase 6 workflow, strategic priority function, telephony, ERP, SoftX, EES, accounting, warehouse, transport, or external synchronization was added.

Findings: P0 0; P1 0; P2 0. P3: Vite reports an ineffective dynamic-import advisory and a >500 kB chunk advisory; both are non-blocking build advisories with no test or runtime failure. Files changed during this acceptance run: this report only. The historical failed/partial acceptance records above are retained and superseded by this successful rerun. Phase 6 is eligible for separate authorization; it was not started by this task.
