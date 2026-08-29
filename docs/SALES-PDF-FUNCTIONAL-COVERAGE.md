# Sales Department PDF — Functional Coverage

Source reviewed: `قسم المبيعات.pdf` (44 pages).

This trace is evidence of implementation coverage, not a replacement for the frozen design or AFDF. Where the PDF names SoftX, accounts, warehouse, or transport, the production pilot deliberately keeps only internal status, responsibility, evidence, and follow-up. It does not claim an external integration. KPI surfaces remain explicitly `TEST_DEMO`; no formula or target in the PDF has been promoted into approved business policy.

Status vocabulary:

- **Implemented** — visible production UI backed by the canonical API/domain.
- **Enforced** — server authorization, validation, audit, or lifecycle rule; not a decorative screen.
- **Internal lifecycle** — operational status/evidence only; no external-system integration.
- **TEST_DEMO** — reporting architecture is present but the business formula remains unapproved.
- **Authorized boundary** — named by the PDF, but deliberately not implemented because the frozen production scope either reserves it for another system or does not define a canonical Sales domain for it.

## Audit result

All 44 pages were traced against the production route, API handler, canonical service, database schema, and acceptance evidence. This pass closed the reachable product gaps it found:

- Representatives and Telesales employees can now open a real persisted customer record from their Customer register.
- Representative pre-visit work now exposes persisted classification, operational status, active state, contact/location, notes, and open-order/Commitment/complaint context.
- Visit completion uses an explicit PDF-aligned result category plus evidence; it is no longer a free-text-only result.
- Credit review is an explicit conditional internal order marker rather than being silently enabled on every Representative order.
- Telesales pre-call review now exposes persisted customer classification/status, active state, location, open orders, open complaints, attempts, and Commitments.
- Telesales complaint and opportunity capture now require explicit classification/kind, responsibility where applicable, due point, and evidence instead of hidden hardcoded defaults.
- Manager review now includes an organization-scoped team-execution ledger derived from canonical visits, calls, Supervisor exceptions, and Commitments.

## Pages 1–12 — Sales Representative

| Page | PDF operating requirement | Production surface and canonical evidence | Status |
|---:|---|---|---|
| 1 | Representative purpose, customer coverage, field execution, sales and follow-up | Representative Today workspace; scoped visits, customers, orders, collections and Commitments. Attendance/vehicle telemetry is not a defined Sales domain | Implemented / Authorized boundary |
| 2 | Daily preparation and prioritized visit plan | “Today” next-action hero and persisted visit ledger ordered by the server-provided plan | Implemented |
| 3 | Discover needs; present relevant products, prices and offers | Visit execution context and product-backed order/opportunity capture. The app does not invent an official price list, discount policy, or pricing authority | Implemented / Authorized boundary |
| 4 | Record an order, register a new customer, and continue order follow-up | Canonical customer creation and order capture, duplicate warning/explicit override, customer-file lifecycle rail | Implemented |
| 5 | New/inactive customers, reactivation reasons and follow-up | Customer classification/active state remain separate; inactive-customer reactivation creates canonical Commitment without silently activating the customer | Implemented |
| 6 | End of route; report visits, orders, collections, new/inactive customers and issues | “My Work” close-day ledger derives counts from persisted domain records | Implemented |
| 7 | Representative prohibitions and performance indicators | Authorization, validation, audit, controlled transitions; reporting definitions are visibly `TEST_DEMO`, not official KPIs | Enforced / TEST_DEMO |
| 8 | End-to-end representative operating sequence | Shared Artifact 0 shell → Today → visit → evidence/outcome → resulting work → Activity/My Work | Implemented |
| 9 | Actual workday start and readiness/visit review | Today plan, open Commitment rail, customer and visit context. A separate HR attendance/vehicle-check domain is not defined in the frozen Sales model | Implemented / Authorized boundary |
| 10 | Account review and explicit visit result categories | Pre-visit canonical customer snapshot; explicit category (order, opportunity, follow-up, issue, no need, inactive customer, or new customer) and evidence are required | Implemented / Enforced |
| 11 | Follow-ups, customers requiring action, route close review | Canonical Commitments and evidence calendar; close-day data is derived rather than manually fabricated | Implemented |
| 12 | Daily report and close-day checklist | My Work registers visits, orders, collections, complaints, opportunities, observations, reactivation and carried work | Implemented |

## Pages 13–19 — Telesales Employee

| Page | PDF operating requirement | Production surface and canonical evidence | Status |
|---:|---|---|---|
| 13 | Telesales purpose and structured customer contact | Artifact 4 queue, scoped customer register, call lifecycle and evidence capture | Implemented |
| 14 | Priority categories and pre-call customer/account review | Dominant next call with explainable reason; persisted customer classification/status, open orders/complaints, contact/location, attempts and Commitment rail | Implemented |
| 15 | Needs, suitable products and cross-sell | Purpose-conditional opportunity/order capture using canonical products and resulting follow-up | Implemented |
| 16 | Conduct call and record order; PDF names SoftX | Queued → live → completed call; canonical internal order capture. No SoftX integration or claim | Implemented / Internal lifecycle |
| 17 | Order follow-up and non-purchase/no-answer handling | Order lifecycle in customer file; explicit no-answer/callback/not-interested outcomes and retry/escalation lineage | Implemented |
| 18 | Close day, daily report and headline indicators | “My Work” derives planned/completed/no-answer/callback/escalation/carryover/open work; any KPI comparison remains `TEST_DEMO` | Implemented / TEST_DEMO |
| 19 | Cross-sell, reactivation, collections, data quality and prohibitions | Purpose-conditional capture with explicit type/classification, responsibility, required evidence/due points, server validation and audit | Implemented / Enforced |

## Pages 20–28 — Telesales Supervisor

| Page | PDF operating requirement | Production surface and canonical evidence | Status |
|---:|---|---|---|
| 20 | Supervisor purpose: readiness, monitoring, direction and intervention | Supervisor Today workspace derives team readiness and operational exceptions | Implemented |
| 21 | Daily priorities, team direction and call-plan review | Team and Queues tabs show canonical calls/exceptions and responsible employees | Implemented |
| 22 | Morning, midday and end-of-day checkpoints | Persisted checkpoint controls and evidence/readiness state; checkpoints are separate, clickable views | Implemented |
| 23 | Quality monitoring and intervention in important cases | Quality review, exception action, reassignment/escalation/follow-up with evidence | Implemented |
| 24 | Collections, inactive customers, orders and operational exception follow-up | Supervisor exceptions reference canonical lower-level work; resulting work uses Commitment service | Implemented |
| 25 | Data quality and coaching during work | Persisted quality review/coaching evidence and resulting follow-up where requested | Implemented |
| 26 | Exception report and Supervisor KPI concepts | Activity evidence and exception ledger; reporting values/targets are not approved formulas | Implemented / TEST_DEMO |
| 27 | Prohibitions, responsibility model and organizational hierarchy | Team-scoped server authorization; actioned remains operationally open until resolved | Enforced |
| 28 | End-to-end Supervisor workflow and next-day preparation | Today → team/queue inspection → action/coaching → evidence → Activity and carried work | Implemented |

## Pages 29–44 — Sales Manager

| Page | PDF operating requirement | Production surface and canonical evidence | Status |
|---:|---|---|---|
| 29 | Manager purpose: lead sales system through evidence and results | Manager workspace reads canonical Supervisor/priority evidence; no parallel operational truth | Implemented |
| 30 | Execution, customers and team management | Review/Priorities/Customers/Activity surfaces reuse canonical customers, exceptions and priorities; team execution is derived from canonical visits, calls, exceptions and Commitments | Implemented |
| 31 | Internal coordination; prior-day review | Manager priorities preserve source evidence, owner, due point and success condition; no external coordination integration | Implemented / Internal lifecycle |
| 32 | Analyze yesterday: what, why, correction and owner | Activity evidence and manager decision record preserve reason, actor and resulting Commitment | Implemented |
| 33 | Set daily priorities, responsibilities and execution plan | Priority creation from Supervisor evidence with idempotency and persisted owner/due/success condition | Implemented |
| 34 | Customer classes and decision-oriented segmentation | Customer register/file exposes classification separately from operational status and active state | Implemented |
| 35 | Customer growth, product opportunity and pricing control | Canonical opportunities/product references; no unauthorized pricing/discount decision is invented | Implemented / Enforced |
| 36 | Credit review and full order lifecycle | Order rail explicitly covers recorded → review/approval → preparation → delivery → closure | Implemented / Internal lifecycle |
| 37 | Accounts, warehouse and transport coordination | Internal order states, responsibility and evidence only; no accounts/warehouse/transport integration | Internal lifecycle |
| 38 | Delivery and complaint management | Delivered does not imply closed; complaints preserve recorded/resolved/closed distinctions and responsible follow-up | Implemented |
| 39 | During-day follow-up and team execution responsibility | Clickable morning/midday/end-of-day checkpoints plus organization-scoped team execution derived from canonical open work | Implemented |
| 40 | Diagnose employee execution and midpoint report | Midday checkpoint asks where execution diverged and counts actioned-but-open work separately | Implemented |
| 41 | End-of-day review and Manager daily report | End-of-day checkpoint, operational Activity calendar and reporting period controls | Implemented |
| 42 | Manager KPI concepts | Persisted definitions/targets and UI are unmistakably `TEST_DEMO`; actuals reconcile to canonical evidence IDs | TEST_DEMO |
| 43 | Manager prohibitions and evidence-first decisions | Server scope, validation, optimistic concurrency, audit and no invented price/credit authority | Enforced |
| 44 | Administrative hierarchy and results-based operating principle | Role-specific routes and server-authoritative scope preserve Representative → Supervisor → Manager evidence lineage | Implemented / Enforced |

## Verification focus

- All four roles use the Artifact 0 shell and role-specific navigation.
- Representative and Telesales execution actions write through canonical APIs; they do not simulate success locally.
- “Activity” is a dedicated evidence calendar, not a shortcut to another tab.
- Telesales leaving Today clears the selected call UI so “My Work,” “Customers,” and “Activity” cannot be trapped behind a stale call.
- Manager checkpoints are interactive and reinterpret the same canonical evidence for morning, midday, and end-of-day questions.
- Notifications are derived from scoped canonical work and do not introduce a notification-owned source of truth.
- External-system wording in the PDF is kept as internal operational lifecycle/evidence only.

## Deliberate boundaries found in the PDF

These are not missing buttons. Implementing them would invent a new domain or violate the accepted scope:

- HR attendance, vehicle inspection, and location telemetry.
- An official product-price/discount/credit-policy engine.
- SoftX, ERP, EES, accounting, warehouse, transport, or telephony synchronization.
- Official KPI formulas, targets, attainment, trends, or employee-performance judgments; the current reporting architecture remains unmistakably `TEST_DEMO`.
- A manager manually performing accounts, warehouse, or transport work. The app records only internal state, responsibility, evidence, and follow-up.

## Acceptance evidence for this trace

- Fresh PostgreSQL 16: migrations 001–009, bootstrap, and Phase 1–7 DEVELOPMENT/TEST seeds passed.
- API/domain/PostgreSQL: 72/72 tests passed.
- Complete RTL/mobile/browser runtime: 60/60 tests passed.
- Protected runtime: all 28 locked files passed integrity verification.
