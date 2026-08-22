# Sales Application — AFDF Studio Design Package

**Status:** Design Mode + prototype preparation only. No production approval; Design DNA is provisional.  
**Primary specification:** `docs/sales-operating-model-plan.md` (approved plan).  
**Evidence:** existing prototype source and the approved plan. The 44-page PDF was not re-audited because the plan has no identified contradiction.  
**Product boundary:** standalone, online-first Sales application with its own data; Arabic RTL-first; no SoftX, EES, ERP, or external operational-system integration.

## 1. Current experience audit

### Verified baseline

The existing mobile prototype has login, a four-item bottom navigation, role switcher, Today, task list, activity history, and notifications. It represents all four roles and demonstrates representative preparation, guided visits, guided calls, customer context, follow-ups, collections, issues, close day, supervisor team/quality views, manager review, and basic admin scheduling.

### What should survive

- Task-first Today and a compact mobile-first working rhythm.
- Guided work capture rather than an unstructured CRM record form.
- The shared visit/call outcome engine, customer context, follow-up creation, collection tracking, close-day check, and role-aware work surface.
- Arabic RTL hierarchy, clear blue actions, and operational rather than marketing language.

### Findings and design implications

| Finding | Evidence | Design response |
| --- | --- | --- |
| Many workflows exist as discrete screens but are disconnected from persistent states. | Static local navigation/sample content. | Model a single work item and its state/history; show what changed and what comes next. |
| Today mixes personal execution and managerial review without a consistent attention order. | Role-specific branches share a generic progress card. | Begin every role’s Today with **next action**, then an attention queue, then progress/context. |
| The three-step visit loses key evidence and exception paths. | Needs and outcome screens are largely option lists. | Use a compact work sheet: context → capture → result → generated next action; reveal only relevant fields. |
| Customer, issue, order, collection, and observation are adjacent but not visibly linked. | Separate pages with summary-only data. | Make Customer the relationship hub and use chronological activity plus linked operational records. |
| Supervisor and manager views are dashboard-shaped but lack action ownership. | Metrics and a few cards; no exception lifecycle. | Use accountable queues, checkpoints, drill-down, and corrective-action records before charts. |
| Existing accessibility cannot be certified from source review. | No rendered/screen-reader/keyboard audit was run. | Artifact acceptance criteria require semantic controls, focus order, contrast, target size, errors, and reduced motion. |

**Audit limit:** this is a source-and-flow audit, not a screenshot audit. No cloud/in-app browser capture capability was available in this session, so rendered visual defects and runtime interaction behavior remain to be checked in Artifact review.

## 2. Product / requirements model

### Roles and jobs

| Role | Primary job | Main decision surface |
| --- | --- | --- |
| Sales Representative | Prepare, visit customers, record outcomes, progress opportunities/collections, close the day. | My day, visit plan, customer work sheet. |
| Telesales Employee | Execute the best next call and capture a complete, followable result. | Next customer to call, call work sheet, call plan. |
| Telesales Supervisor | Keep the call team ready, on-plan, coached, and clear of exceptions. | Time-based checkpoint and team attention queues. |
| Sales Manager | Turn performance/risk signals into assigned priorities and corrective actions. | Operating review, segment/target view, priority delegation. |

Shared objects are Customer, Contact, Work Item/Task, Visit, Call, Outcome A–G, Follow-up, Opportunity, Collection Promise, Issue/Complaint, Internal Order, Market Observation, Priority, Quality Review/Coaching, Target, Notification, and Audit Event. Reference data and rules are internally configurable by authorized admins.

### Shared rules

- A visit or call ends in one explicit outcome; the outcome may create follow-up, opportunity, internal order, issue, reactivation, or no-next-action with rationale.
- Collections are operational promise tracking, never an accounting ledger.
- Internal orders show only internal stages and responsibility: recorded → review → approved → preparation → delivery preparation → delivered → closed; exceptions and rescheduling remain visible.
- Only configured demo/test targets may appear before official targets exist, and they must be labelled **تجريبي / قابل للتعديل**.
- Role permissions limit customer/team visibility and actions; supervisors coach their teams, managers set priorities and targets, and admins maintain reference data/rules.
- Required workflow evidence must be validated before a work item can be completed; role-scoped actions, generated follow-ups, status changes, and assignments remain auditable. No manual summary entry substitutes for persisted operational activity.

## 3. UX blueprint

### Information architecture

**Mobile worker shell:** اليوم (Today) · عملي (My work: plan, tasks, follow-ups) · العملاء (Customers) · النشاط (Activity). A contextual primary action is the next visit/call, never a floating “add anything” button.

**Supervisor shell:** اليوم · الفريق · الطوابير (queues) · النشاط.  
**Manager shell:** المراجعة · الأولويات · العملاء · التقارير.  
**Shared secondary areas:** notifications, search, profile/preferences, and authorised configuration.

The shell adapts by role, but the nouns and status language remain shared. The worker’s plan is not duplicated as a supervisor dashboard; it is viewed through scope-aware drill-down.

### Primary workflows

1. **Start/continue day:** attendance/checklist → prioritised plan → next executable item.
2. **Representative visit:** select planned visit → see customer context → start/reschedule/miss → capture needs/observation → choose outcome A–G → complete relevant detail → generated next work + timeline update.
3. **Telesales call:** next customer → context/offers/collection → record reachable/defer/reschedule/outcome → next customer or generated follow-up.
4. **Customer relationship work:** search/filter → profile/timeline → create linked follow-up, collection promise, issue, order, or observation.
5. **Exception resolution:** issue/order/collection risk → owner/action/due date → status updates → resolution evidence → closure.
6. **Supervisor rhythm:** morning readiness → midday exception triage → end-of-day review; quality review creates coaching and an improvement task.
7. **Manager rhythm:** prior-day review → target/segment/risk signal → assign priority with success condition → monitor completion → next-day priorities.
8. **Close day:** generated summary + incomplete-work disposition; do not ask staff to re-enter recorded data.

### States, adaptation, accessibility

Every work list needs loading/skeleton, no work, no results, delayed/offline-retry copy (online-first), permission-restricted, error/retry, and completed/archived states. Mobile is the execution default; manager reports may expand at tablet/desktop to a two-pane queue/detail view and denser tables. RTL is structural: right-aligned hierarchy, logical rather than physical icon direction, Arabic numerals/date/EGP formatting rules, and no mirrored meaning for trend arrows.

Use landmarks and labelled controls, visible keyboard focus, 44px minimum primary targets, 4.5:1 text contrast, non-colour status labels/icons, announced validation/results, and reduced-motion equivalents. Never encode urgency only by red.

## 4. Domain grounding

The product is a sales **operating rhythm**, not a contact database. Morning means readiness and planned coverage; midday means rescuing misses, promises, and customers at risk; end-of-day means accountable closure and tomorrow’s follow-through. Field staff are interrupted and need customer-specific context in few taps. Telesales works at higher cadence and needs an unambiguous next call. Supervisors need short attention queues; managers need action ownership, not a wall of charts.

A generic AI-generated CRM would use a permanent sidebar, a hero gradient, uniform KPI cards, a fake chart gallery, a prominent “Add lead” CTA, and a generic pipeline. This product avoids that: the primary unit is a time-bound next action; charts only explain an operational question; the customer record is evidence for work rather than the home screen’s centerpiece.

## 5. Creative directions

### A. Recommended — **Operating Ledger / سجل التنفيذ**

- **Thesis:** today is a continuously updated, accountable record of promised work, outcomes, and next commitments.
- **Typography:** Arabic-first humanist sans (Noto Sans Arabic/Tajawal fallback); bold task titles, compact 12–14px metadata, tabular numerals for time/value.
- **Tokens/composition:** warm white canvas, EES navy as the decision surface, blue as the action/linked-record color, restrained semantic status inks; a vertical time/commitment rail orders work instead of equal cards.
- **Density/hierarchy:** dense but breathable list rows; one primary next-action block, then a queue; details use labelled rows and a timeline rather than metric tiles.
- **Interaction/navigation:** confirm completion at the work-item level; generated next steps appear in place with a short success pulse. Role shells privilege the next operational decision.
- **Signature:** the **commitment rail**—time, state, owner, and next action align along one RTL-aware edge across plans, customer activity, and queues.
- **Avoids:** dashboard tile galleries and decorative progress rings; a card exists only where it represents a discrete commitment or exception.

### B. Alternative — **Route & Signal / مسار وإشارة**

- **Thesis:** managers and field teams share a visible route from planned contact to closed outcome, with risks surfacing as signals.
- **Typography/tokens:** same Arabic base; cooler blue-grey field sheets, navy top bars, amber for time risk, restrained coral only for escalation.
- **Composition:** plan-first route strip for workers; supervisors use a signal board grouped by readiness, delayed, and escalation.
- **Interaction/signature:** swipe-free, thumb-friendly step transitions and a concise “why this is priority” signal line.
- **Avoids:** map decoration and generic kanban; route means business progression, not geography.

### C. Alternative — **Briefing Room / غرفة الإحاطة**

- **Thesis:** every role begins from a short, role-specific operational briefing and leaves with named commitments.
- **Typography/tokens:** editorial section headers, thin rules, navy briefing bands, blue linked actions, high data density.
- **Composition:** modular briefing sections with expandable exceptions; desktop manager mode uses a dossier-like two-pane layout.
- **Interaction/signature:** checkpoint stamp (morning/midday/end day) captures a review’s conclusion and actions.
- **Avoids:** a generic BI control room; no chart without a linked queue or decision.

## 6. Anti-AI-slop review and recommendation

Direction A passes the gate: its signature comes from time-bound execution; cards represent work/exception boundaries; pills indicate compact statuses only; no gradients, glass, illustrative hero, decorative chart, or arbitrary animation is proposed. Direction B is credible for heavier plan/queue emphasis; C is strongest for leadership review but risks over-formality on mobile. Recommend **A**, borrowing B’s explicit priority rationale for queues and C’s checkpoint stamp only for supervisor/manager reviews.

## 7. Provisional Design DNA v0.1 — editable

- **Personality:** calm operational confidence; direct, respectful, accountable. “What needs doing next?” outranks visual spectacle.
- **Foundations:** Arabic RTL first; Tailwind remains the future implementation policy, but no implementation is authorised. 4px spacing base; compact mobile density; mobile app chrome stays unobtrusive.
- **Type:** Noto Sans Arabic/Tajawal/system fallback. 24/30 screen title, 18/26 section, 15/22 task/customer title, 12/18 supporting copy, 11/16 meta. Use weight and spacing before colour for hierarchy.
- **Colour:** ink navy `#203761`; action blue `#4285C5`; canvas warm white `#FCFDFE`; rule `#DCE5EE`; quiet blue `#EAF3FB`; success `#167A5B`; caution `#A45A08`; danger `#B42318`. Verify final contrast in Artifact review.
- **Surfaces:** flat canvas and thin rules by default; 12–16px radius for bounded work items, 18–20px only for decision summaries; no glass/gradients; shadow only for a transient sheet/raised control.
- **Components/patterns:** commitment row, next-action block, status label with text, customer snapshot, evidence timeline, work-sheet step header, exception queue, checkpoint summary, ownership/action panel, dense responsive table, configuration form.
- **Data:** values declare period/scope; target labels declare test/demo status; chart has a stated question, comparison, and linked action.
- **Interaction/motion:** one primary action per work step; inline validation; state change confirmed in context; 160–220ms purposeful transitions, opacity/position only; reduced motion removes movement.
- **RTL/responsive:** logical CSS/inset terms; icons have direction only where meaning requires; mobile one-column composition, tablet/desktop queue-detail or table-detail patterns; do not create a desktop sidebar merely by stretching mobile.
- **Guardrails:** no generic CRM pipeline, equal-weight KPI card farm, redundant views per PDF page, unspecified “AI insights,” decorative imagery, or dark mode requirement. Dark mode remains a later product decision, not a prototype assumption.

## 8. Complete screen / experience map

| Experience | Roles | Purpose, key content, and states | Relationships |
| --- | --- | --- | --- |
| Authentication & role landing | All | Sign in, profile/scope, loading/error/unauthorised. | Enters role-aware Today. |
| Today / next action | All | Next executable item, attention queue, checkpoint/progress; empty, overdue, offline retry. | Opens work sheet, plan, queue, notifications. |
| Start my day | Representative | Required readiness checklist, messages, priorities, plan conflicts. | Produces visit plan readiness. |
| Visit plan & rescheduling | Representative | Ordered visits, reason/context, start/reschedule/miss/complete, conflict state. | Opens Visit work sheet/customer. |
| Visit work sheet & outcome | Representative | Snapshot, needs, pricing/delivery/product evidence, optional observation, A–G outcome. | Creates/updates order, issue, follow-up, opportunity, reactivation. |
| Call plan & call work sheet | Telesales | Priority reason, customer context, internal order validation/recording, outcome, defer/reschedule/unreachable reasons. | Same outcome engine; returns next call or internal order record. |
| My work | Representative/Telesales | Tasks, follow-ups, personal assignments; filters, calendar grouping, completion/archive. | Links every task to underlying customer/work record. |
| Customers & Customer profile | Rep/Telesales scoped; Supervisor/Manager broader | Search/filters; overview, orders, visits/calls, follow-ups, collections, issues, notes, timeline. | Hub for linked records and customer actions. |
| New customer / recovery | Rep/Telesales | Minimum profile, reason/owner/due date, reactivation state. | Generates task and appears in customer/change reporting. |
| Follow-up / opportunity | Rep/Telesales; visible upstream | Channel, date, owner, outcome, dismissal rationale. | From outcomes/customer; feeds Today and reports. |
| Collection promise | Workers; escalated upstream | Amount, promise history/date, result, next work, risk/escalation. | Customer/order timeline and queue. |
| Issue / complaint | All creators; Supervisor/Manager resolution | Classify, owner, action, due date, resolution/closure evidence. | From visit/call/order/customer; exception queues. |
| Internal orders | Workers record; Manager oversees | Stage/responsibility, availability/shortage, alternatives, delivery exception/reschedule. | Customer profile, issue/follow-up, manager risk view. |
| Market observation | Rep/Telesales creator; leaders consume | Optional competitor/product/offer/price/market note. | Linked to customer/visit and reports. |
| Supervisor checkpoints & team | Supervisor | Morning/midday/end status, employee cards, readiness/delay/risk queues. | Drill-down, coaching, deviation/action creation. |
| Quality/coaching & deviations | Supervisor | Criteria/rating/note, coaching task/date, recurring deviation history. | Employee and team reports. |
| Manager operating review | Manager | actual/target, segment changes, execution/collection/issue risks, corrective actions, and team training/development actions. | Priorities, targets, employee/team performance, reports. |
| Segments, priorities & targets | Manager | Strategic/growth/stable/declining/inactive/prospective; owner/rule; delegated priority; target scope. | Assignee Today and operating review. |
| Reports & activity | All role-scoped | Explainable KPI detail, trend/period, export later; the Representative daily report is generated from persisted visits, outcomes, orders, collections, issues, observations, and follow-ups; loading/no-data/demo-target states. | Links to source work/customer lists. |
| Notifications & close day | All | Due/escalated work; generated execution summary, incomplete-work disposition. | Returns to Today and audit history. |
| Configuration & audit history | Authorised Admin; role-scoped audit visibility | Reference data, rules, templates, schedules, target administration; immutable event history. | Powers all workflows; explicit permissions. |

## 9. Claude Artifact partition strategy

Use Mode A Design Brief handoff. Begin with Artifact 0 so all later work shares the visual rules; do not make one artifact per screen or one product-sized artifact.

| Order | Artifact | Why it is one review unit |
| --- | --- | --- |
| 0 | Shared system + adaptive shell | Validates DNA, RTL density, navigation, commitment row, states, and role switching. |
| 1 | Representative daily execution | One coherent field journey: readiness → visit → outcome → generated next work → close day. |
| 2 | Telesales daily execution | Tests high-cadence call plan and shared outcome engine without duplicating field UX. |
| 3 | Customer relationship operations | Validates the shared customer hub plus collection, issue, order, recovery, and observation lifecycles. |
| 4 | Supervisor operations | Tests time checkpoints, attention queues, quality/coaching, deviations, and employee drill-down. |
| 5 | Manager operating control + reporting | Tests target/segment/priorities/exception-based reporting and configuration boundaries. |
| 6 | Cross-role integration review | Connects representative/telesales evidence to supervisor/manager action; validates handoffs and permissions. |

## 10. Claude Artifact Design Briefs

### Artifact 0 — Shared system and adaptive shell (v0.1)

**Product context:** Arabic RTL-first standalone Sales operations app. Prototype only; no integration or production code.  
**Screen/experience:** role-aware mobile shell and reusable patterns.  
**Purpose/user goal:** let each role find the next accountable action within seconds.  
**IA/content:** role landing; contextual bottom navigation; next-action block; commitment row; status label; customer snapshot; evidence timeline; empty/loading/error/permission states. Use realistic Arabic sales data and EGP values.  
**Interactions:** switch demo roles, open a commitment, inspect status and timeline, receive inline completion feedback.  
**Creative direction/DNA:** Operating Ledger, provisional DNA v0.1. Warm white, navy decision block, blue actions, thin rules, compact 12–16px-radius bounded items, no gradients or generic KPI grid. The commitment rail is the signature.  
**Accessibility/responsive:** fully RTL, logical icons, visible focus, 44px actions, status text plus colour, reduced motion. Mobile first; show a tablet queue/detail example.  
**Must preserve:** four roles; shared nouns; Today/Work/Customers/Activity concept; no external-system claims.  
**Acceptance:** a reviewer can identify current role, next action, urgency, owner, due time, and route to details without reading a dashboard.

### Artifact 1 — Representative daily execution (v0.1)

**Purpose:** make a field representative’s complete day fast, evidence-rich, and recoverable after interruption.  
**Screens/flow:** Start My Day checklist → ordered Visit Plan → customer snapshot → Visit Work Sheet (context, needs/observation, outcome A–G) → relevant detail (order, opportunity, follow-up, issue, collection, new/recovery) → generated task/timeline → Close My Day → generated Sales Representative daily report/KPI detail.  
**Primary content/actions:** visit reason/time, priority, customer sales/collection/follow-up context; start/reschedule/miss; record evidence; choose one outcome; set owner/date; complete/close; inspect the generated report and drill to source activity. The report represents planned/completed visits, customers visited and outcomes, orders/sales and order value, cross-sold items/opportunities, new and recovered/inactive customers, collections/payment promises, complaints/issues, market/competitor observations, outstanding follow-ups/next actions, and other captured outcomes.  
**States:** no planned visits, delayed/rescheduled, required-field validation, customer with collection risk, issue escalated, no outcome yet, generated follow-up success, incomplete close-day work, no recorded activity, and a clearly labelled configurable **TEST/DEMO** KPI target/value.  
**Constraints:** the report and daily summary derive from persisted activity; they never ask the representative for a manual summary. Market observation is optional and persisted conceptually; internal order is a recorded internal workflow, not SoftX. Collection is operational only. Required outcome evidence must validate before completion, generated next work must remain visible/auditable, and role scope must prevent access to unauthorised customers or actions.  
**Creative/accessibility:** use the commitment rail to hold plan and timeline together; work sheet never becomes a long CRM form. RTL thumb reach, clear result wording, non-colour urgency, reduced motion.  
**Acceptance:** all A–G routes have a credible next step; close day and the dedicated daily report derive from activity; every KPI can drill to persisted source work; demo values cannot appear official; no required external integration is implied.

### Artifact 2 — Telesales execution (v0.1)

**Purpose:** enable a telesales employee to complete the highest-priority call and move confidently to the next.  
**Screens/flow:** Today with Next Customer to Call → Call Plan (priority reason visible) → Call Work Sheet → reachable/defer/reschedule/unreachable and shared outcome → internal order validation/recording where applicable → next customer / generated follow-up → activity/KPI detail.  
**Content/actions:** configured priority rationale (expected order, outstanding payment, large/declining/inactive customer, cross-sell, manager priority), products/offers, collection context, result quality, reschedule reason, and internal order details validated before the order outcome is recorded.  
**States:** plan empty, contact unreachable, deferred with reason/time, incomplete capture, invalid/incomplete order detail, order requiring internal review, order recorded, reactivation, follow-up created, calculated KPI with explicit period/scope.  
**Constraints:** order handling is internal and standalone: validate the available customer/order evidence before recording the order outcome, retain its internal status and audit history, and do not imply SoftX or another external integration. Required call/outcome evidence and role scope validate before completion; defer/reschedule must retain a reason and next date.  
**DNA/anti-generic:** same system as Artifact 0; high cadence uses stacked commitment rows, not a call-center dashboard.  
**Acceptance:** next call is always unambiguous; every defer/outcome has a rationale and next state; an order cannot be recorded until its required internal details validate; shared results feel identical in meaning to visit outcomes; no external order integration is implied.

### Artifact 3 — Customer relationship operations (v0.1)

**Purpose:** let authorised people understand a customer’s current truth and progress linked operational work without losing history.  
**Screens/flow:** Customer search/filter → Profile overview + evidence timeline → collection promise / issue lifecycle / internal order stage / new-customer or recovery / market observation → linked follow-up and return to profile.  
**Content/actions:** customer classification, contacts, latest order/visit/call, open promises/issues/follow-ups, owner, due date, order stage/responsibility, observations.  
**States:** no search result, restricted customer, overdue promise, issue escalation/resolution, availability/delivery exception, inactive recovery, empty timeline.  
**Constraints:** customer visibility and actions are role-scoped. An issue cannot be closed by recording a note: classification, owner, corrective action, follow-up, resolution, and closure evidence remain distinct and auditable. Internal order, collection, and observation records retain their linked customer/work-item context.  
**Creative/accessibility:** Customer is a calm evidence hub, not a CRM profile with endless tabs; use progressive disclosure and linked timeline records.  
**Acceptance:** a reviewer can tell what is happening, who owns it, what is due, and how order/collection/issue/follow-up relate; no accounting or external sync is claimed.

### Artifact 4 — Supervisor operations (v0.1)

**Purpose:** help a telesales supervisor intervene at the right checkpoint, coach specifically, and close exceptions with ownership.  
**Screens/flow:** Morning/Midday/End checkpoint → Team Operations → readiness/delayed/declining/inactive/collection-risk queue → employee drill-down → call quality review → coaching/improvement task → deviation record.  
**Content/actions:** team progress with denominator, employees needing attention, source call criteria/rating/note, action owner/date, deviation history.  
**States:** no exceptions, missed plan, weak conversion, poor data quality, unresolved issue, recurring error, coaching due.  
**Constraints:** checkpoint conclusions, quality ratings, coaching, improvement tasks, and deviations require an accountable owner and are visible only within authorised team scope; unresolved work cannot be represented as resolved without resolution/closure evidence.  
**Creative/accessibility:** checkpoint stamp appears only for a completed review; queues communicate urgency and cause before aggregate charts.  
**Acceptance:** the supervisor can move from signal to employee/customer/work item and create a verifiable corrective action in one continuous flow.

### Artifact 5 — Manager operating control and reporting (v0.1)

**Purpose:** turn daily commercial and execution evidence into explicit, delegated corrective work.  
**Screens/flow:** daily operating review → actual vs configured target → customer segments → risk/exception detail → create priority or team training/development action → assignee Today/team-performance confirmation → report drill-down; include authorised Admin target/reference-data configuration boundary.  
**Content/actions:** prior sales, orders, customer changes, collections, issues, market observations, team execution; segment and target scope; priority instruction/due time/success condition; employee/team performance evidence; and a training/development action with audience, objective, owner, due date, and completion evidence.  
**States:** demo target labelled, missing data, target out of scope, no risks, priority overdue, training/development action due or completed, and restricted configuration.  
**Constraints:** only an authorised Admin may change reference data, templates, rules, or target configuration. The manager may create role-scoped corrective and development actions but cannot see or alter data outside authorised scope; each assignment, status change, and action outcome remains auditable.  
**Creative/accessibility:** prefer a question-led comparison and action queue to charts. A chart earns its place only when it directs to a source list or action.  
**Acceptance:** commercial and execution KPIs are visibly separate; every risk can become an owned priority or justified training/development action; demo targets cannot be mistaken for official targets; configuration is not exposed as a default manager capability.

### Artifact 6 — Cross-role integration review (v0.1)

**Purpose:** prove that work changes hands without breaking shared meaning, permissions, or accountability.  
**Flow:** representative issue/market observation and telesales collection promise → supervisor queue/coaching → manager priority → worker Today → resolved/closed timeline.  
**Required states:** role permission boundary, notification, reassignment, overdue escalation, audit history, resolved and closed records.  
**Constraints:** validate required evidence at each handoff; preserve source, owner, due date, status history, and generated next action; prohibit unauthorised view/edit/closure; keep configuration as Admin-only; and never imply external-system synchronisation.  
**Acceptance:** objects retain their status, owner, evidence, and next action across roles; the interface does not duplicate records or expose unauthorised actions.

## 11. Requirements coverage check

| Approved requirement area | Covered by |
| --- | --- |
| Four roles, task-first, Arabic RTL, online-first, standalone/no integrations | Product model, Artifact 0, all briefs. |
| Rep preparation, visits, A–G results, collections, customers, close day, generated daily reporting/KPIs | Artifacts 1 and 3; screen map. Artifact 1 derives visit/outcome, order/value, cross-sell, new/recovered customers, collections/promises, issues, observations, and follow-up/next-action reporting from persisted activity. |
| Market observations, new customer, inactive recovery | Artifacts 1 and 3. |
| Telesales plan, next call, call outcomes/reactivation, internal order validation, KPIs | Artifact 2. Internal standalone order details validate before recording; no SoftX or external integration. |
| Supervisor checkpoints, queues, coaching, deviations, team KPIs | Artifact 4. |
| Manager review, segmentation, priorities, targets, corrective work, team training/development, reports | Artifact 5. |
| Internal order stages and exceptions | Artifact 3. |
| Managed issues/complaints, notifications, audit history | Artifacts 3 and 6. |
| Configurable reference data, templates, target rules, permissions, audit/validation guardrails | Artifact 5 plus screen map; authorised Admin configuration only, with role-scoped workflow validation and audit history across Artifacts 1–6. |

## 12. Open assumptions / human decisions

1. **Recorded decision:** existing EES navy/blue is recognisable brand context; AFDF/Claude may refine shades for accessibility and the approved direction. Exact existing hex values are not mandatory.
2. **Recorded decision:** equal iPhone and Android mobile-first; supervisor/manager experiences may adapt to tablet/desktop.
3. **Recorded decision:** KPI/target values remain configurable **TEST/DEMO** values until official values are provided.
4. **Recorded decision:** configuration administration is an authorised Admin capability with appropriate permissions, not automatically available to every Sales Manager.
5. **Recorded decision:** dark mode is excluded from the initial prototype/V1 design scope.

## Validation record

- Every major approved-plan requirement has a mapped experience or Artifact brief.
- All four roles and shared operations are covered.
- RTL, accessibility, and mobile/desktop adaptation are specified as first-class constraints.
- The direction is grounded in daily sales operation and rejects generic CRM/dashboard defaults.
- All partitions inherit provisional Design DNA v0.1; it is not frozen.
- Each brief is self-contained and does not require Claude to read the PDF, repository, or AFDF.
- No production application file or AFDF file was modified. Implementation Mode was not entered.
