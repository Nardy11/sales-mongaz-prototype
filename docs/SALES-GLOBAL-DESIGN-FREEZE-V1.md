# Sales Global Design Freeze V1

**Status:** GLOBAL SALES PROTOTYPE DESIGN FROZEN  
**Freeze date:** 2026-08-22  
**Decision owner:** Sales Operations product/design approval authority (individual name not recorded in this repository)  
**AFDF mode:** Design Freeze  
**Product:** Standalone, online-first Sales Operations prototype; Arabic RTL-first.

This record freezes the approved design baseline only. It does not authorize production implementation, backend work, integrations, or a new prototype artifact.

Future implementation agents **MUST NOT reinterpret or silently redesign** this frozen prototype. Any design change requires an explicit design-change request and a newly approved design version.

## Canonical approved artifacts

The following current files are the six canonical approved artifacts. Artifact 2 and Artifact 5 include the approved final P1 closure-stage correction.

| Artifact | Role / purpose | Canonical path | SHA-256 |
| --- | --- | --- | --- |
| 0 | Operating Ledger and shared Design DNA | `artifacts/artifact-0-operating-ledger.jsx` | `B2C1B82B5A89484C8AE4463E5A6472305CF0311BC70CA76A3807B0DDAD1A64FC` |
| 1 | Sales Representative Daily Workspace | `artifacts/artifact-1-rep-daily-workspace.jsx` | `225359F10F52C35CD69A8C0B842A89353BED55E4A6D4DCE93832D8219CE12E56` |
| 2 | Customer Operating File | `artifacts/artifact-2-customer-operating-file.jsx` | `F859D24412DC83282854302FA417080BB540F7CE6212F7FF033935B91A4061FA` |
| 3 | Telesales Supervisor Workspace | `artifacts/artifact-3-supervisor-workspace.jsx` | `61739E42EA6C3F43FD91AA985CD4AA71B15AF0DC9FF6A7E917C37B6DDAA55E87` |
| 4 | Telesales Employee Workspace | `artifacts/artifact-4-telesales-employee-workspace.jsx` | `527907D1F09B4884FC392B6546813A226E1784807B4489B81003C15D3ABB3F1C` |
| 5 | Sales Manager Workspace | `artifacts/artifact-5-manager-workspace.jsx` | `0F86E393D8348603CBE62A0AB50FD734B09BB2D5B25F03423BCFE5DBE808855E` |

The AFDF baseline/framework document remains unmodified by this freeze activity: `docs/sales-afdf-design-package.md`, SHA-256 `06375A3A5432D03E8F7B09D3D4841E7FB57010A8D6CA4021B09FC92444424C3D`.

## Frozen Design DNA

- **Arabic RTL-first:** Arabic hierarchy, right-aligned operational reading order, logical directional treatment, and readable Arabic system/Tajawal typography.
- **Operating Ledger:** the experience is an accountable record of work, evidence, ownership, time, and next commitment—not a generic CRM or dashboard.
- **Evidence before action:** a user sees the reason, owner, due point, state, and linked operational evidence before acting.
- **Commitment Rail:** time-bound commitments, activity, and next work use a rail/node language that makes open, risk, completed, and empty states legible.
- **Hierarchy:** a navy next-action hero comes before attention queues and supporting context; dense ledger/register rows organise details.
- **Visual tokens:** warm-white canvas; navy decision surface; blue action/link colour; restrained success, caution, and danger semantics; brass accent and soft status backgrounds; thin rules and compact rounded work/exception surfaces.
- **Density and type:** compact, breathable operational rows; bold task/customer labels; 11–14px supporting copy; tabular treatment for time and values where used.
- **Status and attention:** status always has text and is not colour-only. Urgent, caution, normal, open, completed, and empty states remain operationally meaningful.
- **Interaction primitives:** explicit action chips/buttons, register expansion, contextual detail, evidence rows, lifecycle mini-rails, checkpoint switching, role-aware bottom navigation, and in-context confirmation/toast feedback.
- **Responsive philosophy:** mobile is the execution default. Supervisor and Manager may switch to a tablet/desktop split queue/detail or table/detail presentation; mobile is not stretched into a generic desktop sidebar.
- **Anti-generic-dashboard constraint:** do not replace operational queues with equal-weight KPI card farms, decorative chart galleries, generic pipelines, gradients, glass effects, or invented AI-insight surfaces.

## Approved navigation and role boundaries

| Role | Primary navigation | Operational contract |
| --- | --- | --- |
| Sales Representative | Today, My Work, Customers, Activity | Executes visits and customer work, records outcomes, linked follow-ups, collections, orders, issues, observations, and closes the day from recorded work. May not exercise supervisor/manager control or configuration. |
| Telesales Employee | Today, My Work, Customers, Activity | Executes the next call/call plan, captures an explicit outcome, and creates internally linked follow-up, collection, order, complaint, opportunity, or reactivation evidence. May not resolve work outside assigned authority. |
| Telesales Supervisor | Today, Team, Queues, Activity | Uses morning/midday/end-of-day checkpoints; triages team exceptions, checks quality, creates coaching/follow-up/escalation, and monitors team execution. Supervisor action is not automatic operational resolution. |
| Sales Manager | Review, Priorities, Customers, Reports | Reviews operational signals, records priorities and corrective/development decisions, and monitors exceptions and results. The Manager is not an employee-level warehouse, transport, or call-execution surface. |

Shared secondary controls include search, notifications, role context, and the approved mobile/tablet device presentation where demonstrated. Management-controlled/reference configuration remains outside ordinary worker control.

## Shared product/domain semantics

| Domain concept | Frozen semantic contract |
| --- | --- |
| Customer | Relationship and operational-evidence hub for contact, activity, orders, collections, issues, opportunities, and next commitments. |
| Order/request | Internal record with stage, responsibility, exception/reschedule context, delivery status, and explicit closure evidence. |
| Collection / payment promise | Operational follow-up of amount, promise point, outcome, and next action; never an accounting ledger. |
| Complaint/issue | A recorded customer/operational problem with classification, owner, corrective action, follow-up, resolution evidence, and closure. |
| Opportunity/cross-sell | A customer-linked commercial opportunity with owner and next action; not an unbounded CRM pipeline. |
| Market observation | Lightweight customer/visit/call-linked competitor, product, offer, price, or market evidence for authorised operational review. |
| Priority | A role-scoped, owned instruction with reason, due point, and follow-up. Production must support a distinct success condition. |
| Commitment/follow-up | A named owner, due point, reason, and next action generated from or linked to real operational work. |
| Inactive/reactivated customer | A visible customer state with a recovery/re-activation attempt, reason, owner, and follow-up—not silently converted to active. |
| Operational exception | A visible risk/blocker with evidence, owner, action/decision state, and continued-open semantics until true resolution. |
| Coaching / development action | Supervisor/Manager-led evidence-based improvement work with owner and follow-up; it is distinct from ordinary employee execution. |

## Frozen lifecycle and state invariants

### Internal order lifecycle

`customer order/request → order recorded → accounts/credit review when applicable → approval → warehouse/preparation → transport/delivery preparation → delivery → closure`

These are internal status-and-responsibility concepts only. **Delivered is not closed.** A delivered order may be closure-pending. Closure is the explicit final state and holds lightweight evidence: closure status, responsible owner/party, recorded completion point, and concise result note where useful.

### Complaint lifecycle

`record → classify → assign owner/party → corrective action → follow-up → resolution → closure`

**Recorded is not resolved.** A note, classification, escalation, or decision does not close the underlying complaint without genuine completion and closure evidence.

### Supervisor and Manager semantics

- Supervisor acted → work may remain operationally open → follow-up/escalation remains visible → genuine completion closes it.
- Manager decision recorded → downstream execution may remain open → continuing work remains visible → genuine operational completion closes it.
- The existing `isOperationallyOpen` style of semantics in supervisor/manager workspaces preserves this distinction. A decision must not make an order, complaint, or follow-up disappear prematurely.

## Approved scope and data policy

- Standalone Sales application; later standalone internal database/API; online-first; four operational roles; Arabic RTL-first.
- Reference data and targets are configuration-driven in a future authorised production model.
- No SoftX, ERP, EES, external accounting, warehouse-system, transport-system, or other external integration is represented or authorised.
- Accounts/credit, warehouse/preparation, and transport/delivery are internal status/responsibility tracking concepts only.
- All KPI targets, financial examples, counts, thresholds, customer values, and operational examples in the prototype are **TEST/DEMO** unless explicitly sourced as official company data. They must never silently become production targets; authorised configuration must replace them without source changes where appropriate.

## Known prototype limitations and intentionally deferred concerns

The frozen prototype does not provide persistent shared state, a database/API, authentication, authorization enforcement, audit history, notifications/reminders, configurable reference data, real KPI calculation, data validation, concurrency handling, full loading/error/empty states, or production accessibility/responsive/RTL verification. These are production concerns, not instructions to reopen the frozen design.

## Freeze verification record

- All six canonical artifact sources passed JSX syntax transformation.
- `npm run check:runtime` passed (28 protected runtime files).
- The final Artifact 2 and Artifact 5 lifecycle correction is present: delivery is followed by explicit closure, including pending-closure and fully-closed examples and evidence.
- No P0/P1 functional contradiction was found during this freeze verification.
- No production application file, artifact file, or AFDF framework file was modified by creation of this record; this document and the handoff document are documentation-only additions.

**Phase boundary:** DESIGN FROZEN. PRODUCTION IMPLEMENTATION NOT YET AUTHORIZED.
