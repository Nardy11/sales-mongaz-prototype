# Sales Production Implementation Plan V1

**Phase:** AFDF Implementation Planning  
**Status:** Planning complete; implementation is not authorized.  
**Authoritative design sources:** `docs/SALES-GLOBAL-DESIGN-FREEZE-V1.md`, `docs/SALES-PRODUCTION-HANDOFF-V1.md`, and the six hash-verified frozen artifacts.

This plan preserves the frozen design/product contract. It proposes a production architecture; it does not create code, a database, API routes, dependency changes, or a new UI.

## 1. Source verification and classification

### Verified frozen baseline

The six artifact hashes were checked against the freeze record before planning. Artifact 2 and 5 include the approved final lifecycle correction: delivery is followed by explicit closure, and a recorded management decision may leave work operationally open.

### Requirement labels used below

- **PDF REQUIREMENT** — derived from the approved Sales operating model.
- **APPROVED PRODUCT/SCOPE DECISION** — standalone, online-first, Arabic RTL-first Sales application, with four roles and no external integrations.
- **FROZEN DESIGN CONTRACT** — approved visual/interaction/semantic baseline from the freeze documents and Artifacts 0–5.
- **PROPOSED TECHNICAL ARCHITECTURE** — implementation recommendation, subject to separate implementation authorization.

## 2. Current repository assessment

| Area | What exists today | Planning consequence |
| --- | --- | --- |
| Frontend | React 19 + TypeScript 7 + Vite 8 single-page app. | Keep the React/Vite foundation; introduce production feature modules rather than adding a second frontend. |
| Runtime | Calibrated mobile runtime (`src/mobile/`) with PhoneFrame, MobileScroll, Keyboard, FlowStack, Carousel, BottomSheet, device chrome, and gesture tests. | **KEEP** intact; it is protected and provides useful mobile interaction primitives. |
| App architecture | `src/Prototype.tsx` is a large local-state demo with a `View` union and conditional rendering. | **REPLACE LATER** as the production application composition; do not copy prototype business state into production. |
| Navigation | No router dependency or URL routes; prototype changes local view state. | Add explicit route/navigation architecture in implementation. |
| Styling | Hand-authored CSS in `src/prototype.css` and global runtime CSS; no Tailwind package/configuration. | Build a frozen Design DNA token/component layer; Tailwind is absent today and is an optional implementation choice, not an existing dependency. |
| State/data | Local `useState` fixtures only; no server-state library, forms library, or schema validation library. | Add separated server state, local UI state, and shared validation contracts. |
| Auth/API/database | Login is demonstrative only; no backend, database, authentication, authorization, or API client exists. The Cloudflare Worker is static SPA fallback only. | Deliver a standalone API and database as a modular monolith. |
| Tests/tooling | TypeScript strict check through build; Playwright runtime interaction tests; Node worker tests; runtime hash check; Vite build. No lint script, domain/API/authorization/product-flow tests. | Preserve runtime/build tests and add product/domain/API/UI test layers. |

Reusable code worth preserving: `MobileRuntime`, `MobileScroll`, `FlowStack`, `Carousel`, `BottomSheet`, keyboard-aware fields, device/asset handling, worker fallback, runtime integrity checks, build pipeline, and existing Playwright setup. The current static prototype content, local mock login, direct conditional navigation, and generic pre-freeze EES styling are not authoritative where they conflict with the frozen artifacts; replace them only during authorized implementation while preserving protected runtime behavior.

## 3. Recommended production architecture

### PROPOSED TECHNICAL ARCHITECTURE — smallest robust shape

Use a **modular monolith**:

- **Web frontend:** the existing React + TypeScript + Vite application, organised by feature and role-aware routes.
- **Standalone API:** one TypeScript Node service with modules for identity, customers, commitments, field work, telesales, orders, complaints, supervision, management, reporting, configuration, notifications, and audit.
- **Database:** one PostgreSQL database with relational transactional records and append-only audit rows.
- **Deployment boundary:** frontend/static worker may remain a static host; API/database deployment is separate. This is an internal boundary, not an external-system connector architecture.

Recommended implementation libraries, to be installed only after authorization: React Router for URL navigation; TanStack Query for server state; React Hook Form plus Zod for forms and shared schemas; Fastify plus Zod for the API; PostgreSQL plus Prisma or a comparable type-safe migration/query layer; secure HTTP-only cookie sessions. These are recommendations, not current repository dependencies or requirements.

### Frontend module boundaries

- `app/`: route composition, session bootstrap, role shell, error boundaries, direction/language setup.
- `design-system/`: frozen tokens and primitives: app shell, next-action hero, Commitment Rail, ledger/register row, status/attention label, evidence list, lifecycle mini-rail, queue/detail layout, empty/error/loading states.
- `features/auth`, `customers`, `commitments`, `visits`, `calls`, `orders`, `collections`, `complaints`, `opportunities`, `observations`, `supervision`, `priorities`, `reporting`, `configuration`.
- `lib/`: API client, schema adapters, permissions, date/number formatting, error handling.

Each feature owns its screens, query keys, mutations, form schemas, and state adapters. The UI shell is role-aware: workers get Today/My Work/Customers/Activity; Supervisor gets Today/Team/Queues/Activity; Manager gets Review/Priorities/Customers/Reports. This is a **FROZEN DESIGN CONTRACT**, not a generic route map.

### Frontend state, forms, and resilience

- Server records, lists, dashboards, and derived reports use query caching/invalidation; transient sheets, selection, filters, and draft UI state remain local.
- Forms use reusable schemas for usability feedback and API validation. Backend responses remain authoritative.
- Online-first: retry safe reads and idempotent writes; show stale-data indication when appropriate; protect unsaved drafts on navigation; use optimistic updates only for reversible, conflict-safe actions (for example acknowledgement/low-risk status UI), never for closure, financial evidence, lifecycle transitions, or manager decisions until server confirmation.
- Every route defines loading/skeleton, empty/no-work, permission-denied, error/retry, and archived/completed treatment without changing the frozen hierarchy.
- RTL is structural (`dir="rtl"`, logical CSS properties, direction-aware icons); responsive work starts mobile-first and promotes approved supervisor/manager split layouts at tablet/desktop.
- Accessibility is designed into primitive APIs: semantic landmark/heading hierarchy, labelled controls, focus restoration in sheets, keyboard operation, 44px targets, non-colour statuses, live validation/status announcements, reduced motion, and contrast verification.

### Backend modules and services

- **Identity & authorization:** sessions, employees, teams, roles, scopes, administrative configuration capability.
- **Customer operations:** customer profile, contacts, customer state, visit/call context, activity evidence.
- **Commitments:** source-linked commitments/follow-ups, assignment, due point, completion, next commitment, escalation.
- **Orders:** order/request, line items/reference products, internal lifecycle events, exception/reschedule, explicit closure evidence.
- **Collections:** balances-as-operational-context, payment promises, collection outcomes and follow-up; no accounting ledger.
- **Complaints:** issue lifecycle, responsibility, corrective action, resolution and closure evidence.
- **Leadership:** supervisor interventions/coaching/development; manager priorities/decisions and success conditions.
- **Reporting:** read models/queries derived from persisted operational evidence and configured targets.
- **Configuration and audit:** authorised reference data/target configuration and immutable audit capture.

No microservices, event-sourcing platform, generic workflow engine, connector framework, or offline-sync system is proposed for V1.

## 4. Proposed production domain model

**PROPOSED TECHNICAL ARCHITECTURE — this is not a PDF database schema.** Common transactional fields: immutable ID, organization scope, created/updated timestamps, creator, and audit correlation ID. Keep source evidence as linked records/notes rather than overloading status labels.

| Entity/domain | Purpose, major fields, relationships, lifecycle/audit |
| --- | --- |
| Organization, team, employee, role assignment | Defines ownership/scope. Employee has role assignment, manager/supervisor/team relation, active state. Audit all role/scope changes. |
| Customer and contact | Customer identity, classification, area/territory, active/inactive/reactivation state; contacts, activity and linked records. Customer classification is configured reference data. |
| Visit and call | Planned/started/completed/rescheduled/missed contact work; customer, assignee, context, explicit outcome, evidence, timestamps. Outcome may create domain records and commitments atomically. |
| Commitment/follow-up | Core rail item: source type/ID, owner, due point, status, priority/reason, completion evidence, next commitment link, escalation relation. Open/completed/cancelled must not imply underlying source closure. |
| Order/request and order item | Internal requested items, customer, owner, responsible party, value/quantity, exception/reschedule context. Items reference internal product/reference data where applicable. |
| Order lifecycle event and closure evidence | Append-only transition: from/to stage, actor, responsible party, recorded point, note/evidence. Closure evidence is explicit and only valid after delivered. |
| Collection and payment promise | Operational collection result and promise history: customer, source order if relevant, amount, due date, result, follow-up. Validate positive values/dates; do not model external accounts receivable synchronization. |
| Complaint/issue and lifecycle event | Customer/source link, classification, owner, corrective action, follow-up, resolution evidence, closure. Event rows capture each meaningful lifecycle change. |
| Opportunity/cross-sell and market observation | Customer/source activity, owner, state/next action; observation category, competitor/product/offer/value/note. These support work and reports, not a generic lead pipeline. |
| Operational exception | Read-model/work record linking a risky source object to severity, owner, reason/evidence, intervention/decision state, and operational-open state. Do not use a manager decision as a closure flag. |
| Priority | Manager-owned subject/reason, responsible party, due point, urgency, state, **success condition**, result/evidence, and linked commitments. |
| Coaching and development action | Supervisor/manager action, employee/team, evidence/reason, owner, due/follow-up, completion evidence. Separate from manager priority and worker execution. |
| Reference data and target configuration | Versioned active/inactive configured values: classifications, complaint types, outcome reasons, observation categories, products/reference items, safe display/status values, KPI targets. Keep core lifecycle rules and permissions in code. Target carries scope, period, unit, source label (`TEST_DEMO` or `OFFICIAL`), effective dates, authorisation/audit. |
| KPI snapshot/read model | Derived facts/aggregates by role/team/territory/customer segment and period, with source/effective calculation metadata. Rebuildable from operational evidence; targets are joined, not hard-coded. |
| Audit event | Append-only actor, action, resource/type/ID, before/after allowed fields or diff, reason, timestamp, request/correlation ID, and source context. Protect access and retention. |

## 5. Explicit state machines and Commitment Rail

### Order — FROZEN DESIGN CONTRACT

`customer order/request → recorded → accounts/credit review (when applicable) → approval → warehouse/preparation → transport/delivery preparation → delivery → closure`

Technical rule: stages are controlled enum transitions, recorded as lifecycle events. A delivery event cannot auto-create closure. `closed` requires the delivery stage and closure status, owner/party, recorded completion point, and result note/evidence. Reopening, if later permitted, requires an authorised explicit event and audit reason.

### Complaint — FROZEN DESIGN CONTRACT

`record → classify → assign owner/party → corrective action → follow-up → resolution → closure`

Technical rule: recording/classifying/escalating is not resolution. Closing requires resolution and closure evidence. Required owner/action/follow-up validation is enforced server-side.

### Operational-open semantics — FROZEN DESIGN CONTRACT

Store a decision/intervention as its own record or event, and derive operational openness from the underlying source/commitments. Do not encode it by a single overloaded `status`. A supervisor intervention or manager decision can be `recorded` while linked work/commitments remain open; queues/reporting query this derived state.

### Commitment mechanism — PROPOSED TECHNICAL ARCHITECTURE

Use explicit domain service methods, not a generic rules engine:

1. A source activity/outcome is saved in one transaction.
2. The service validates required evidence and creates/updates its linked domain record.
3. It creates a named commitment when a next action is required: source, owner, due point, reason, state.
4. Completion attaches evidence and either ends the commitment or creates the next linked commitment.
5. Due/overdue evaluation produces queue/report notifications; it does not alter source resolution by itself.

Examples: visit outcome → follow-up; no-answer call → retry; payment promise → payment follow-up; complaint → corrective/follow-up work; order stage/exception → lifecycle follow-up; supervisor or manager action → downstream responsibility. Scheduled reminders can be a small background job only after approved notification requirements are implemented.

## 6. Identity, authorization, configuration, reporting, and audit

### Authentication/authorization

**PROPOSED TECHNICAL ARCHITECTURE:** password login over TLS with Argon2id password hashes, server-side session records, secure HttpOnly/SameSite cookies, CSRF protection for state-changing requests, session rotation/revocation, and rate limiting. Route/action guards improve UX but backend policy enforcement is authoritative.

- Rep/Telesales: assigned/customer-scope work and own permitted records.
- Supervisor: team scope, queues, quality/coaching/intervention, not manager targets/configuration.
- Manager: authorised department/territory scope, priorities, decisions, reports, development actions; no execution authority for warehouse/transport/call work.
- Administrative configuration: a narrowly scoped capability/permission, not a fifth operational workspace. It changes reference data/targets only with audit.

### Configuration and TEST/DEMO policy

Make routine values configurable with effective-date/version controls: classifications, complaint/outcome/observation options, product/reference items, safe labels, targets and demo replacement values. Keep order/complaint state-machine invariants, closure semantics, and permissions as controlled code. All target/report displays expose scope, period, unit, and `TEST_DEMO` versus `OFFICIAL`; TEST/DEMO never silently becomes official.

### KPI/reporting

Persist operational facts once and derive metrics: completed/planned visits/calls, outcomes, order values, collections/promises, customer changes, quality/coaching, issues, follow-ups, market observations, exception age, and commitment completion. Role reports are query/read-model views, not manually re-entered summaries. Rep/Telesales see personal execution; Supervisor sees team readiness/quality/queue trends; Manager sees commercial versus execution metrics, targets, segments, risks, priorities, and outcomes. Recalculate idempotently by period/scope after source changes; retain calculation/source metadata.

### Audit and data integrity

Audit order/complaint transitions, promise and collection outcomes, assignment/reassignment, supervisor intervention, manager decision/priority, configuration, closure/reopen, and permission-sensitive changes. Use application transactions, database foreign keys/checks, idempotency keys for write commands, optimistic versioning on contested records, unique constraints/warnings for duplicate orders as appropriate, and server-side authorization/validation. This is proportional audit logging, not event sourcing.

## 7. Validation, online-first, security

- **Frontend usability validation:** required customer/context, positive quantity/amount, duplicate-order warning/confirmation, complaint classification/owner/action, promise amount/date, commitment owner/due point, closure evidence; show clear Arabic RTL feedback.
- **Backend authoritative validation:** repeats and enforces these rules plus transition permissions, scope, lifecycle sequencing, referential integrity, and idempotency.
- **Online-first behaviour:** failure/retry states, stale-data indicators, safe retry/idempotency, draft-loss warning. No offline queues/synchronisation/conflict architecture in V1.
- **Security review:** authenticated/session-secure endpoints; role/scope enforcement; least-privilege access to customer/operational data; validation at the API edge; audit integrity; controlled destructive/reopen actions; duplicate submission safeguards; concurrency/race review for stage transitions, promises, assignments, and configuration.

## 8. Delivery phases — coherent vertical slices

| Phase | Objective and work | Tests / acceptance | Frozen reference |
| --- | --- | --- | --- |
| 0. Foundation | Preserve runtime; establish route shell, direction/tokens/primitives, API skeleton, PostgreSQL/migrations, session/role model, audit foundation. | Build/type/runtime tests; login/session/role-denial tests; RTL shell and primitive visual review. | 0 |
| 1. Customer + Commitment core | Customer/contact, activity evidence, commitment service/rail, ownership/due/completion, query/list states. | Unit/API tests for commitment chaining; worker queue UI/RTL/accessibility tests. | 0, 2 |
| 2. Representative slice | Start day, plan/visit, outcome capture, follow-up/opportunity/collection/issue/observation, close-day derived report. | Visit → outcome → commitment; promise validation; close-day derivation; rep scope tests. | 1, 2 |
| 3. Telesales slice | Call queue/context, explicit outcomes, retry/no-answer, order validation/recording, activity/close day. | Call → next/retry; order duplicate/quantity validation; telesales scope/responsive tests. | 4, 2 |
| 4. Order and complaint lifecycle | Complete internal order service/lifecycle mini-rail and complaint lifecycle with internal responsibility and closure evidence. | Delivered ≠ closed; complaint recorded ≠ resolved; transition/closure/audit tests. | 2, 5 |
| 5. Supervisor slice | Checkpoints, team/exception queues, quality review, coaching/intervention, still-open semantics. | Intervention does not resolve underlying work; team-scope authorization; tablet queue/detail comparison. | 3 |
| 6. Manager slice | Review, priorities with success condition, decisions, exception visibility, development actions, customer/report drill-down. | Decision → downstream work → closure; priority success condition; manager scope/report correctness. | 5 |
| 7. Reporting/configuration | KPI read models, target configuration and TEST/DEMO distinction, authorised configuration, approved reminders if required. | Metric provenance/target labeling; configuration audit/permissions; no manual-summary regression. | 1–5 |
| 8. Hardening and acceptance | Performance, security, migration rehearsals, error/loading/empty states, full role/workflow QA and design fidelity review. | End-to-end critical workflows, visual/RTL/responsive/accessibility checks, backup/recovery and concurrency review. | 0–5 |

Dependencies: Phase 0 precedes all work; Phase 1 is required for worker slices; Phase 4 depends on customer/commitment foundations and feeds leadership slices; Phases 5–7 depend on persisted evidence/read models; Phase 8 follows all vertical slices.

## 9. Migration/reuse strategy

| Classification | Existing code | Strategy |
| --- | --- | --- |
| KEEP | Mobile runtime, device safe-area/keyboard/gesture components, asset pipeline, runtime tests, Vite/TypeScript build, static-worker fallback. | Preserve contracts; extend only under a separately authorised runtime change. |
| ADAPT | `src/App.tsx` composition, Vite static deployment, Playwright configuration, existing KeyboardInput/MobileScroll/FlowStack/BottomSheet primitives. | Introduce production routes/features around them, preserving mobile constraints. |
| REPLACE | `src/Prototype.tsx`, prototype CSS, mock login, local fixture state, direct view-state navigation, pre-freeze generic visual composition. | Replace incrementally behind route/feature seams using frozen artifacts as source of truth; no blind copy/paste. |
| REMOVE LATER | Demo-only state/data and obsolete visual paths after production equivalents pass fidelity/regression review. | Remove only after replacement is accepted; keep no duplicate source of truth. |

## 10. Test, QA, and design-fidelity strategy

### Test layers

- Unit: transition guards, commitment creation/chaining, KPI derivation, permissions, formatting.
- Domain/state-machine: order and complaint invariants, action-recorded vs operationally-open behaviour, closure/reopen audit.
- API/integration: validation, authentication/session, authorization scope, transaction/idempotency/concurrency cases.
- UI/rendered: role routes, forms, loading/error/empty/permission states, keyboard/sheet behaviour, RTL, responsive layouts, accessibility.
- End-to-end: Rep visit → outcome → commitment; Rep order → lifecycle; Telesales call → next/retry; payment promise → miss → escalation; complaint → resolution → closure; Supervisor intervention → still-open/resolved; Manager decision → downstream execution → closure; Manager priority → success condition; Close My Day/report derivation.

### Frozen design fidelity

Create component-level visual QA for token primitives, then artifact-by-artifact acceptance reviews: Artifact 0 governs shared DNA; 1 Rep; 2 customer/order/collection/complaint; 3 Supervisor; 4 Telesales; 5 Manager. Compare composition, density, hierarchy, navigation, visible states, interaction semantics, Arabic RTL, and mobile/tablet presentation—not screenshots from memory. Any difference that changes frozen design requires formal change control.

## 11. Traceability

| Frozen requirement/design | Production module | Phase | Validation |
| --- | --- | --- | --- |
| Operating Ledger, rail, evidence-first, Arabic RTL | design-system, commitments, shell | 0–1 | visual/RTL/accessibility review |
| Rep daily execution and close-day derivation | visits, commitments, reporting | 2 | E2E rep flow and derived-report tests |
| Customer operating file and internal lifecycle | customers, orders, collections, complaints | 1, 4 | lifecycle, closure, audit tests |
| Telesales execution | calls, commitments, orders | 3 | call/retry/outcome tests |
| Supervisor boundary and open semantics | supervision, exceptions, coaching | 5 | scope and still-open tests |
| Manager priorities/decisions/success condition | priorities, reporting, exceptions | 6 | decision/downstream/success-condition tests |
| TEST/DEMO policy and configured targets | configuration, reporting | 7 | label, permission, audit tests |
| No external integration | architecture/module boundaries | all | architecture/API review |

## 12. Real open decisions before implementation

| Decision | Why it matters | Recommended default | Safe to defer? |
| --- | --- | --- | --- |
| Hosting/operational environment for API and PostgreSQL | Determines deployment, secrets, backup, and session topology. | Managed PostgreSQL plus a single managed Node service in the organization-approved environment. | No—decide before Phase 0 deployment work. |
| Identity source and employee provisioning | Affects login onboarding and role/team authority. | Local employee accounts with admin-managed role/team assignment for V1; no external identity integration. | No—decide before Phase 0. |
| Organization/scope taxonomy | Determines manager/supervisor record visibility. | Company → Sales department → team → employee, with territory/customer scope where required. | No—confirm before authorization rules. |
| Official KPI definitions/targets | TEST/DEMO values cannot become official by accident. | Launch with explicitly labelled TEST/DEMO configuration; approve official definitions/targets through authorised configuration later. | Yes—until reporting acceptance, if label remains clear. |
| Retention/export requirements for audit data | Affects storage and permission rules. | Retain internal audit events with role-restricted viewing; confirm formal policy before production rollout. | Yes—before rollout, not before core slices. |

## 13. Implementation boundary

This plan does **not** authorize implementation. Do not create migrations, API routes, production screens, dependency changes, package changes, or external integrations until explicit implementation authorization is provided. Frozen Artifacts 0–5 and the AFDF framework remain unchanged by this planning task.
