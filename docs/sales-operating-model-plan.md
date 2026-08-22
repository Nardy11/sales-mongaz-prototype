# EES Sales Operating Model — End-to-End Implementation Plan

## Plan status and source labels

This document is an approved implementation plan only. It does not authorize implementation.

Every item is labelled by origin:

- **PDF requirement**: directly derived from the 44-page Sales Department PDF.
- **Approved scope decision**: agreed product constraints supplied by the team.
- **Proposed technical architecture**: an implementation choice that supports the requirements and scope.

The application is a standalone, online-first Sales application with its own backend and database. Arabic RTL is a primary requirement. The supported roles are Sales Representative, Telesales Employee, Telesales Supervisor, and Sales Manager. SoftX, EES, ERP, accounting, warehouse, transport, and all other external-system integrations are out of scope.

## Audit summary

| PDF area | Classification |
| --- | --- |
| EES mobile shell, Arabic RTL, navigation, task cards, login layout, dark mode, activity heatmap | Already implemented and correct |
| Role-aware Today, Tasks, profile role switcher, notifications, activity, task templates | Implemented but incomplete: static sample data and local navigation only |
| Sales Representative preparation, visit, outcome, collection, customer, follow-up, issue, close-day screens | Implemented but incomplete: no persistence, workflow enforcement, task generation, or calculations |
| Telesales call plan and guided call screens | Implemented but incomplete: no prioritisation engine, persisted outcomes, reactivation flow, or real KPIs |
| Supervisor team view and call quality review | Implemented but incomplete: no checkpoints, coaching history, exception handling, or reports |
| Manager dashboard and daily review | Implemented but incomplete: no targets, segmentation, priority assignment, operational review, or reports |
| New-customer onboarding, inactive-customer recovery, market observations, internal order lifecycle, managed complaint lifecycle | Missing |
| Authentication, authorization, API, database, task engine, notifications, reference-data administration, KPI calculations | Requires backend work |
| External order-system synchronization | Deferred — external integrations are out of scope |

No permanent visual-design freeze applies. During this planning phase there is no UI redesign or implementation. In the later AFDF Design phase, visual language, information architecture, navigation presentation, screen composition, components, interactions, and dashboards may be redesigned while preserving approved Sales functionality, permissions, data requirements, and scope.

## Shared foundation

1. **PDF requirement:** Preserve role-specific, task-first operating workflows and daily execution visibility.
2. **Approved scope decision:** Keep the application standalone, online-first, Arabic RTL-first, and free from external integrations.
3. **Proposed technical architecture:** Retain the existing mobile runtime and refactor only app-owned UI into reusable role-aware modules; do not modify protected runtime files.
4. **Proposed technical architecture:** Use a standalone API and database with a future-safe organization model: Company → Division → Department → Team → Job Role → Employee. This hierarchy is an architecture choice, not a PDF claim.
5. Add authentication, employee profile retrieval, work schedules, territories, supervisor/team relationships, and role-based access control.
6. Persist customers, contacts, classifications, products, promotions, targets, tasks, templates, checklists, visits, calls, outcomes, follow-ups, opportunities, collections, issues, internal order records, market observations, notifications, and KPI snapshots.
7. Implement recurring, scheduled, follow-up, workflow, manager-assigned, and optional personal tasks; assign templates to employee, role, team, or department.
8. Build internal administration for configurable reference data: products, offers, territories, classifications, reasons, issue types, urgency, follow-up rules, targets, and task templates.
9. **Proposed technical architecture:** Provide stable API resources for identity, customers, tasks, visits, calls, follow-ups, collections, issues, orders, reports, targets, and reference data. Exact endpoint layout is a technical choice, not a PDF requirement.

## Sales Representative

### Operational workflow

1. **PDF requirement:** Implement a required Start My Day checklist covering attendance, visit plan, priority customers, follow-ups, declining/inactive customers, pending orders, collections, promotions, new products, and management messages.
2. **PDF requirement:** Provide an ordered visit plan with customer context, visit reason, status, and start/reschedule/miss/complete actions.
3. **PDF requirement:** Complete the guided visit workflow: customer overview; needs, pricing, delivery, products, and market observations; configurable cross-sell suggestions; mandatory A–G visit result; relevant next step.
4. **PDF requirement:** Support new-customer opening and inactive-customer recovery with reason capture, responsible owner, due date, and follow-up task generation.
5. **PDF requirement:** Support collection follow-up with outstanding amount, promise date/history, outcome, note, and next task. It is operational tracking only, not an accounting ledger.
6. **PDF requirement:** Deliver a live Customer Profile with Overview, Orders, Visits, Follow-ups, Collections, Issues, and Notes; include customer search and PDF-aligned filters.
7. **PDF requirement:** Deliver Close My Day from existing recorded activity, including incomplete-work review and a generated daily execution summary.

### Market and competitor observations

1. **PDF requirement:** Add a lightweight persisted Market Observation associated with the relevant customer and, where applicable, visit.
2. Optional fields: customer/visit, competitor, product, observed competitor price, competitor offer/promotion, new-product observation, market change, free-text note, date, and reporting employee.
3. Do not require competitive-intelligence fields for every visit. Observations automatically feed the representative daily report and are visible to authorized supervisors/managers.

### Reporting and KPIs

1. **PDF requirement:** Provide an explicit Sales Representative report/dashboard rather than relying solely on shared reporting.
2. Capture planned/completed visits, customers visited, orders/sales generated, sales/order value, cross-sold items, new customers, inactive/stopped customers, collections and payment follow-up, complaints/issues, market observations, outstanding follow-ups, and other recorded operational outcomes.
3. **Approved scope decision:** Use clearly labelled configurable TEST/DEMO KPI targets and sample values only. They must never be represented as official company targets and can be replaced by authorized users without code changes.

## Telesales Employee

1. **PDF requirement:** Generate daily call plans using configured priorities: expected orders, outstanding payments, large customers, declining customers, inactive customers, cross-sell candidates, and manager priorities.
2. Make Next Customer to Call the primary Today action; support defer, reschedule, complete, and unreachable outcomes with reasons.
3. Complete the guided call workflow: customer context, products/offers, need discovery, cross-sell, collection context, internal order outcome, and result classification.
4. Use the same outcome and automatic-follow-up engine as visits, including telesales-specific customer reactivation.
5. Persist call completion, result quality, customer updates, scheduled follow-ups, and call-plan execution.
6. **PDF requirement:** Provide calls completed, call-plan completion, orders/outcomes, conversion, sales value, average order value, cross-sell, reactivation, collection follow-up, and data-quality KPI views.

## Telesales Supervisor

1. **PDF requirement:** Add Morning, Midday, and End-of-Day checkpoints for attendance, plan readiness, execution progress, missed customers, collections, issues, pending orders, and follow-ups.
2. Build a team operations view with employee cards, exceptions, employee drill-down, and concise attention queues instead of a large BI dashboard.
3. Add call-plan readiness, delayed-customer, declining-customer, inactive-customer, and collection-risk queues.
4. **PDF requirement:** Complete call-quality review with source criteria, rating, note, coaching action, follow-up date, and employee improvement task.
5. Add operational deviation records for missed plans, weak conversion, poor data quality, unresolved issues, and repeated workflow errors.
6. Generate supervisor reports and KPI snapshots for team attainment, plan execution, conversion, order value, growth/reactivation, error rate, data quality, and issue resolution.

## Sales Manager

1. **PDF requirement:** Build daily review around previous sales, targets, orders, customer changes, collections, execution risks, operational problems, and corrective actions.
2. **PDF requirement:** Support customer segmentation: strategic, growth, stable, declining, inactive, and prospective, with related action rules and owners.
3. Implement manager priority creation and delegation with employee/customer, instructions, due time, success condition, and task visibility in the assignee's Today view.
4. Add target planning and monitoring by team, territory, employee, and customer segment; separate commercial KPIs from execution KPIs.
5. Support internal operational workflows for product availability signals, pricing exceptions, credit/collection review, delivery problems, complaints, and order follow-up. No external synchronization is included.
6. Generate daily manager reports for actual versus target, customer changes, team execution, collections, issues, market observations, risks, and next-day priorities.

## Internal order lifecycle

1. **PDF requirement:** Preserve the business progression as an internal workflow:

   `customer order/request → order recorded → accounts/credit review where applicable → approval → warehouse/preparation → transport/delivery preparation → delivery → closure`

2. Store business-stage status records and responsibility internally. Support availability/shortage information, affected customers/orders, alternatives, delivery problems, urgent cases, rescheduling, and order-outcome follow-ups.
3. **Approved scope decision:** Do not create SoftX, ERP, EES, accounting, warehouse, transport, or other external integration work.

## Issues and complaints

1. **PDF requirement:** Implement a managed lifecycle:

   `record → classify → assign responsible owner/party → corrective action → follow-up → resolution → closure`

2. Persist issue/complaint type, customer, originating visit/call/order when relevant, description, owner, required action, status, follow-up date, resolution, and closure information.
3. Keep unresolved and escalated items visible to supervisors and managers. Recording a note does not resolve the issue.

## Shared reporting, KPIs, and notifications

1. Replace static metrics and heatmap values with calculated execution events and daily aggregates.
2. Maintain explainable role-specific KPI definitions based on tasks, visits, calls, outcomes, collections, customer changes, quality records, and market observations.
3. Add in-app notifications for due tasks, visits/calls, follow-ups, collection promises, unresolved issues, missed plans, and close-day warnings. Strong alerts are reserved for explicitly important work.
4. Maintain audit history for tasks, assignments, outcomes, follow-ups, collections, issues, coaching, order-stage changes, priorities, and market observations.

## Phased delivery

1. **Foundation and prototype consolidation:** preserve current app behavior, split app-owned prototype code into reusable modules, replace static navigation state with typed workflow state, and create PDF-aligned fixture data.
2. **Standalone backend and administration:** deliver authentication, roles, organization hierarchy, reference data, customer/product data, task templates, task generation, persistence, and audit history.
3. **Sales Representative release:** deliver preparation, visit plan, visit workflow, customer profile, outcomes, follow-ups, collections, issues, new/inactive customers, market observations, internal order stages, representative reports, and configurable demo KPIs.
4. **Telesales release:** deliver call planning, guided calls, outcomes, reactivation, call execution, and telesales KPI reporting.
5. **Supervisor release:** deliver checkpoints, team exception queues, coaching, quality review, deviation records, and supervisor reporting.
6. **Manager release:** deliver segmentation, priorities, targets, corrective actions, operational reviews, manager reports, and organization-level KPIs.
7. **AFDF design and prototype validation:** explore the future visual/IA design, create an interactive simulation, collect user approval, then prepare production implementation.
8. **Hardening and rollout:** validate authorization, Arabic RTL, mobile safe areas, keyboard behavior, failure handling, data integrity, report correctness, and role-by-role acceptance scenarios.

## Verification

- Test role-specific Today screens, assigned scope, permissions, tasks, and daily progress.
- Test every visit/call result A–G, including follow-up, opportunity, issue, collection, new customer, inactive customer, reactivation, and no-need paths.
- Test automatic task generation, rescheduling, close-day rules, KPI aggregation, configurable demo-target replacement, notifications, issue resolution, market observations, and order-stage progression.
- Confirm no test/demo KPI value appears as an official company target.
- Confirm no SoftX, EES, ERP, or other external integration is introduced.
- Run runtime-integrity, build, mobile interaction, RTL accessibility, authorization, and data-integrity checks before handoff.

## Final validation against the PDF

This plan covers Sales Representative procedures and reporting (pages 1–12), Telesales procedures and KPIs (pages 13–19), Supervisor responsibilities and checkpoints (pages 20–28), and Sales Manager responsibilities, coordination, reporting, and KPIs (pages 29–44). Role ownership remains aligned to the PDF: Representatives execute visits and customer work; Telesales executes calls; Supervisors manage call-team execution and coaching; Managers own targets, priorities, exception management, and operating results.
