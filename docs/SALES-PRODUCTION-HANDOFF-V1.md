# Sales Production Handoff V1

**Status:** Production handoff contract only.  
**Implementation authorization:** Not granted. The next phase must separately invoke AFDF Implementation Mode.

## A. Frozen references

The authoritative frozen baseline, six artifact paths, and SHA-256 hashes are recorded in `docs/SALES-GLOBAL-DESIGN-FREEZE-V1.md`. Implementations must validate against that record before design-affecting work.

## B. Design DNA that must be preserved

Preserve the Arabic RTL-first Operating Ledger language: evidence before action; next-action hero; Commitment Rail; dense ledger/register rows; compact rounded work/exception surfaces; navy decision surface, blue action colour, brass accent, restrained semantic states, and thin-rule hierarchy. Preserve the anti-generic-dashboard constraint and the mobile-first execution model.

## C. Role contracts

- **Sales Representative:** execute planned field/customer work and record accountable outcomes, evidence, and generated next work.
- **Telesales Employee:** execute the call queue and capture explicit, followable call outcomes.
- **Telesales Supervisor:** manage readiness, exceptions, quality, coaching, and team follow-up; not Manager powers.
- **Sales Manager:** set/monitor priorities and corrective/development decisions from operational evidence; not an employee-level micromanagement interface.

Role-scoped visibility and action permissions must preserve these boundaries.

## D. Shared domain semantics

Implement the frozen product semantics—not a database schema—for customer, internal order/request, collection/payment promise, complaint/issue, opportunity/cross-sell, market observation, priority, commitment/follow-up, inactive/reactivated customer, operational exception, coaching, and development action. Each operational record must retain its relevant owner, status, evidence, due/follow-up point, and linked source work.

## E. Workflow invariants

- Required evidence and one explicit visit/call outcome are captured before workflow completion.
- Follow-ups, assignments, stage changes, actions, and outcomes remain traceable/auditable.
- **Decision/action recorded does not mean operational work resolved.** Keep the work visible until genuine completion.
- Supervisor action may leave a follow-up/escalation operationally open.
- Manager decision may leave downstream execution operationally open.
- A manager priority must include a distinct production success condition.
- Collections are operational promise tracking, never an accounting ledger.

## F. Responsive requirements

Mobile is the execution default. Maintain safe, legible, thumb-friendly one-column worker flows. Supervisor/Manager views may use the approved tablet/desktop queue-detail or table-detail split; do not substitute a generic permanent desktop sidebar or dashboard for the approved hierarchy.

## G. Accessibility expectations

Verify semantic controls and landmarks, logical focus order, visible focus, 44px minimum primary targets, 4.5:1 text contrast, text/icon status redundancy, announced validation/results, and reduced-motion handling. Verify with rendered and assistive-technology testing; prototype source review is not certification.

## H. RTL requirements

Treat RTL as structural: Arabic-first hierarchy, logical CSS/inset properties, correct direction-sensitive icons, readable Arabic type, and appropriate Arabic date/number/EGP formatting. Do not mirror semantic trend arrows blindly.

## I. State/lifecycle invariants

### Orders

`customer order/request → order recorded → accounts/credit review when applicable → approval → warehouse/preparation → transport/delivery preparation → delivery → closure`

Delivery and closure are distinct. Closure is explicit and records status, owner/party, completion point, and concise outcome note as useful. Availability, warehouse, transport, and credit are internal status/responsibility concepts.

### Complaints

`record → classify → assign owner/party → corrective action → follow-up → resolution → closure`

Recording, escalation, or a management decision does not resolve or close a complaint.

## J. Scope exclusions

Do not introduce SoftX, ERP, EES, external accounting, warehouse, transport, or other external integrations. Do not imply automatic synchronisation. No production implementation is authorised by this handoff document itself.

## K. Production concerns intentionally deferred from the prototype

- Persistent shared state; standalone database; standalone API.
- Authentication, authorization/role enforcement, and audit history.
- Approved notifications/reminders.
- Configurable reference data and configurable replacement of TEST/DEMO targets.
- Real KPI calculations, data validation, and concurrency/conflict handling where required.
- Production loading, error, empty, accessibility, responsive, and RTL verification.

## L. Validation expectations

Before implementation handoff/acceptance: verify artifact-hash alignment; role-by-role workflow and permission tests; order and complaint lifecycle tests; supervisor/manager open-versus-resolved semantics; source-evidence/audit tests; RTL and responsive rendered tests; accessibility validation; data integrity; error/loading/empty states; and confirmation that TEST/DEMO data cannot appear as official targets by default.

## M. Change control

Implementation agents MUST NOT reinterpret or silently redesign the frozen experience. A design-affecting change requires an explicit design-change request and a new approved design version. Technical implementation choices may evolve only when they preserve the frozen contracts above.

**Current project state:** DESIGN FROZEN; PRODUCTION IMPLEMENTATION NOT YET AUTHORIZED.
