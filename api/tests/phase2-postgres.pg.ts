/** PostgreSQL Phase 2 acceptance. Run after migrate/bootstrap/Phase 1 seed/Phase 2 seed with DATABASE_URL. */
import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { PostgresIdentityRepository } from "../src/repository";
import { AuditService } from "../src/audit";
import {
  CustomerCommitmentService,
  type Actor,
} from "../src/customer-commitment";
import { RepresentativeService } from "../src/representative";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required for test:api:phase2.");
const sql = postgres(url, { max: 10 });
const repo = new PostgresIdentityRepository(sql);
const audit = new AuditService(repo);
const commitments = new CustomerCommitmentService(sql, audit);
const representative = new RepresentativeService(sql, audit, commitments);
const run = async () => {
  const rep = await repo.findEmployeeByEmail("rep@local.test");
  assert.ok(rep);
  const actor: Actor = {
    id: rep.id,
    organizationId: rep.organizationId!,
    teamId: rep.teamId,
    role: "sales_representative",
  };
  const customer = (
    await sql<
      any[]
    >`SELECT id,is_active AS "isActive",classification,operational_status AS "operationalStatus" FROM customers WHERE owner_employee_id=${actor.id} ORDER BY is_active DESC LIMIT 1`
  )[0];
  const inactive = (
    await sql<
      any[]
    >`SELECT id,is_active AS "isActive",classification,operational_status AS "operationalStatus" FROM customers WHERE owner_employee_id=${actor.id} AND is_active=false LIMIT 1`
  )[0];
  assert.ok(customer && inactive);
  return { actor, customer, inactive };
};

test("visit lifecycle persists, requires in-progress state, audits, and appears in canonical activity", async () => {
  const { actor, customer } = await run();
  const visit = await representative.createVisit(
    actor,
    {
      customerId: customer.id,
      plannedAt: new Date().toISOString(),
      purpose: "TEST visit",
      idempotencyKey: randomUUID(),
    },
    "test-visit",
  );
  await assert.rejects(
    () =>
      representative.completeVisit(
        actor,
        visit.id,
        { outcome: "x", evidence: "e" },
        "test",
      ),
    { statusCode: 409 },
  );
  await representative.startVisit(actor, visit.id, "test");
  const completed = await representative.completeVisit(
    actor,
    visit.id,
    {
      outcome: "completed",
      evidence: "evidence",
      followUpTitle: "next",
      followUpDueAt: new Date(Date.now() + 86400000).toISOString(),
    },
    "test",
  );
  assert.ok(completed.commitmentId);
  await assert.rejects(
    () =>
      representative.completeVisit(
        actor,
        visit.id,
        { outcome: "x", evidence: "e" },
        "test",
      ),
    { statusCode: 409 },
  );
  const row = (
    await sql<
      any[]
    >`SELECT status,outcome,evidence FROM visits WHERE id=${visit.id}`
  )[0];
  assert.deepEqual(row, {
    status: "completed",
    outcome: "completed",
    evidence: "evidence",
  });
  const activity = await representative.activity(actor);
  const event = activity.find(
    (x) => x.kind === "visit" && x.sourceId === visit.id,
  );
  assert.ok(event);
  assert.match(event.detail, /completed/);
  assert.match(event.detail, /evidence/);
  assert.ok(
    (await repo.listAudit()).some(
      (x) => x.action === "visit.completed" && x.resourceId === visit.id,
    ),
  );
});

test("order persists recorded lifecycle, item, duplicate warning, and override", async () => {
  const { actor } = await run();
  const product = (
    await sql<
      any[]
    >`SELECT id FROM products WHERE organization_id=${actor.organizationId} LIMIT 1`
  )[0];
  assert.ok(product);
  const customerId = randomUUID();
  await sql`INSERT INTO customers(id,organization_id,owner_employee_id,owner_team_id,name,classification,operational_status,is_active) VALUES(${customerId},${actor.organizationId},${actor.id},${actor.teamId},${`phase2-order-${customerId}`},'follow_up','normal',true)`;
  const first = await representative.createOrder(
    actor,
    { customerId, productId: product.id, quantity: 2, unitPrice: 10 },
    "test-order",
  );
  assert.equal(first.status, "recorded");
  const item = (
    await sql<
      any[]
    >`SELECT o.status,oi.quantity FROM sales_orders o JOIN sales_order_items oi ON oi.order_id=o.id WHERE o.id=${first.id}`
  )[0];
  assert.equal(item.status, "recorded");
  assert.equal(Number(item.quantity), 2);
  await assert.rejects(
    () =>
      representative.createOrder(
        actor,
        { customerId, productId: product.id, quantity: 1 },
        "test",
      ),
    { statusCode: 409 },
  );
  const override = await representative.createOrder(
    actor,
    {
      customerId,
      productId: product.id,
      quantity: 1,
      duplicateOverrideReason: "TEST explicit override",
    },
    "test",
  );
  assert.ok(override.id);
  assert.ok(
    (await repo.listAudit()).some(
      (x) => x.action === "order.recorded" && x.resourceId === first.id,
    ),
  );
});

test("promise, complaint, opportunity, observation use existing commitments and appear in the canonical customer file", async () => {
  const { actor, customer } = await run();
  const due = new Date(Date.now() + 86400000).toISOString();
  const promise = await representative.capture(
    actor,
    "collection",
    {
      customerId: customer.id,
      outcome: "promise",
      promiseAmount: 100,
      promiseDueAt: due,
      evidence: "promise evidence",
      followUpTitle: "promise follow-up",
      followUpDueAt: due,
    },
    "test",
  );
  assert.ok(promise.commitmentId);
  const collection = (
    await sql<
      any[]
    >`SELECT outcome,promise_amount AS "promiseAmount",commitment_id AS "commitmentId" FROM collection_outcomes WHERE id=${promise.id}`
  )[0];
  assert.equal(collection.outcome, "promise");
  assert.equal(Number(collection.promiseAmount), 100);
  assert.equal(collection.commitmentId, promise.commitmentId);
  const complaint = await representative.capture(
    actor,
    "complaint",
    {
      customerId: customer.id,
      classification: "quality",
      description: "issue",
      responsibleParty: "operations",
      requiredAction: "inspect",
      followUpTitle: "complaint follow-up",
      followUpDueAt: due,
    },
    "test",
  );
  const cr = (
    await sql<
      any[]
    >`SELECT status,responsible_party AS "owner",commitment_id AS "commitmentId" FROM complaints WHERE id=${complaint.id}`
  )[0];
  assert.equal(cr.status, "recorded");
  assert.equal(cr.owner, "operations");
  assert.equal(cr.commitmentId, complaint.commitmentId);
  const opportunity = await representative.capture(
    actor,
    "opportunity",
    {
      customerId: customer.id,
      kind: "cross_sell",
      note: "need",
      productReference: "TEST",
      followUpTitle: "opportunity follow-up",
      followUpDueAt: due,
    },
    "test",
  );
  assert.ok(
    (
      await sql<any[]>`SELECT id FROM opportunities WHERE id=${opportunity.id}`
    )[0],
  );
  const observation = await representative.capture(
    actor,
    "observation",
    {
      customerId: customer.id,
      observationType: "competitor",
      competitor: "TEST",
      productReference: "TEST",
      competitorPrice: 12,
      offer: "promo",
      note: "market",
    },
    "test",
  );
  assert.ok(
    (
      await sql<
        any[]
      >`SELECT id FROM market_observations WHERE id=${observation.id}`
    )[0],
  );
  const file = await commitments.customerDetail(actor, customer.id);
  assert.ok(file);
  assert.ok(
    file.collections.some(
      (item: any) =>
        item.id === promise.id && item.commitmentId === promise.commitmentId,
    ),
  );
  assert.ok(
    file.opportunities.some(
      (item: any) => item.id === opportunity.id && item.note === "need",
    ),
  );
  assert.ok(
    file.observations.some(
      (item: any) => item.id === observation.id && item.note === "market",
    ),
  );
});

test("Representative cannot change customer classification while Supervisor can within team scope", async () => {
  const { actor, customer } = await run();
  const next = customer.classification === "gold" ? "silver" : "gold";
  await assert.rejects(
    () =>
      commitments.updateCustomer(
        actor,
        customer.id,
        { classification: next },
        "rep-classification",
      ),
    { statusCode: 403 },
  );
  assert.equal(
    (
      await sql<
        any[]
      >`SELECT classification FROM customers WHERE id=${customer.id}`
    )[0].classification,
    customer.classification,
  );
  await commitments.updateCustomer(
    { ...actor, role: "telesales_supervisor" },
    customer.id,
    { classification: next },
    "supervisor-classification",
  );
  assert.equal(
    (
      await sql<
        any[]
      >`SELECT classification FROM customers WHERE id=${customer.id}`
    )[0].classification,
    next,
  );
});

test("Manager customer detail follows organization scope while Supervisor remains team-scoped", async () => {
  const { actor } = await run();
  const manager = await repo.findEmployeeByEmail("manager@local.test");
  assert.ok(manager);
  const foreignTeamId = randomUUID();
  const foreignOwnerId = randomUUID();
  const customerId = randomUUID();
  await sql`INSERT INTO teams(id,organization_id,name) VALUES(${foreignTeamId},${actor.organizationId},${`phase2-manager-scope-${foreignTeamId}`})`;
  await sql`INSERT INTO employees(id,organization_id,team_id,email,display_name,role,password_hash,active) VALUES(${foreignOwnerId},${actor.organizationId},${foreignTeamId},${`phase2-manager-scope-${foreignOwnerId}@test.local`},'Phase2 manager scope employee','sales_representative','test-only',true)`;
  await sql`INSERT INTO customers(id,organization_id,owner_employee_id,owner_team_id,name,classification,operational_status,is_active) VALUES(${customerId},${actor.organizationId},${foreignOwnerId},${foreignTeamId},${`phase2-manager-scope-customer-${customerId}`},'follow_up','normal',true)`;
  const managerActor: Actor = {
    id: manager.id,
    organizationId: manager.organizationId!,
    teamId: manager.teamId,
    role: "sales_manager",
  };
  const managerList = await commitments.listCustomers(managerActor);
  assert.ok(managerList.some((item: any) => item.id === customerId));
  assert.ok(await commitments.customerDetail(managerActor, customerId));
  const supervisorActor: Actor = { ...actor, role: "telesales_supervisor" };
  assert.equal(
    await commitments.customerDetail(supervisorActor, customerId),
    null,
  );
});

test("payment promise rejects invalid due data and rolls back source, commitment, and audit on dependent failure", async () => {
  const { actor, customer } = await run();
  const due = new Date(Date.now() + 86400000).toISOString();
  const before = (
    await sql<
      any[]
    >`SELECT (SELECT count(*)::int FROM collection_outcomes) AS collections,(SELECT count(*)::int FROM commitments WHERE source_type='collection') AS commitments,(SELECT count(*)::int FROM audit_events WHERE action IN ('collection.created','commitment.created')) AS audits`
  )[0];
  await assert.rejects(
    () =>
      representative.capture(
        actor,
        "collection",
        {
          customerId: customer.id,
          outcome: "promise",
          promiseAmount: 100,
          evidence: "missing due",
        },
        "invalid-promise",
      ),
    { statusCode: 422 },
  );
  assert.deepEqual(
    (
      await sql<
        any[]
      >`SELECT (SELECT count(*)::int FROM collection_outcomes) AS collections,(SELECT count(*)::int FROM commitments WHERE source_type='collection') AS commitments,(SELECT count(*)::int FROM audit_events WHERE action IN ('collection.created','commitment.created')) AS audits`
    )[0],
    before,
  );
  await sql`CREATE OR REPLACE FUNCTION phase2_reject_promise_insert() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'forced promise failure'; END $$`;
  await sql`CREATE TRIGGER phase2_reject_promise_insert BEFORE INSERT ON collection_outcomes FOR EACH ROW EXECUTE FUNCTION phase2_reject_promise_insert()`;
  try {
    await assert.rejects(() =>
      representative.capture(
        actor,
        "collection",
        {
          customerId: customer.id,
          outcome: "promise",
          promiseAmount: 100,
          promiseDueAt: due,
          evidence: "forced failure",
          followUpTitle: "retry follow-up",
          followUpDueAt: due,
        },
        "forced-promise",
      ),
    );
  } finally {
    await sql`DROP TRIGGER IF EXISTS phase2_reject_promise_insert ON collection_outcomes`;
    await sql`DROP FUNCTION IF EXISTS phase2_reject_promise_insert()`;
  }
  assert.deepEqual(
    (
      await sql<
        any[]
      >`SELECT (SELECT count(*)::int FROM collection_outcomes) AS collections,(SELECT count(*)::int FROM commitments WHERE source_type='collection') AS commitments,(SELECT count(*)::int FROM audit_events WHERE action IN ('collection.created','commitment.created')) AS audits`
    )[0],
    before,
  );
  const retry = await representative.capture(
    actor,
    "collection",
    {
      customerId: customer.id,
      outcome: "promise",
      promiseAmount: 100,
      promiseDueAt: due,
      evidence: "valid retry",
      followUpTitle: "retry follow-up",
      followUpDueAt: due,
    },
    "valid-retry",
  );
  assert.ok(retry.commitmentId);
  const after = (
    await sql<
      any[]
    >`SELECT (SELECT count(*)::int FROM collection_outcomes WHERE id=${retry.id}) AS collections,(SELECT count(*)::int FROM commitments WHERE id=${retry.commitmentId}) AS commitments,(SELECT count(*)::int FROM audit_events WHERE resource_id IN (${retry.id},${retry.commitmentId})) AS audits`
  )[0];
  assert.deepEqual(after, { collections: 1, commitments: 1, audits: 2 });
});

test("reactivation creates a follow-up without activating or changing customer semantics", async () => {
  const { actor, inactive } = await run();
  const due = new Date(Date.now() + 86400000).toISOString();
  const result = await representative.reactivate(
    actor,
    inactive.id,
    {
      evidence: "reactivation evidence",
      title: "reactivation follow-up",
      dueAt: due,
    },
    "test-reactivation",
  );
  const customer = (
    await sql<
      any[]
    >`SELECT is_active AS "isActive",classification,operational_status AS "operationalStatus" FROM customers WHERE id=${inactive.id}`
  )[0];
  assert.equal(customer.isActive, false);
  assert.equal(customer.classification, inactive.classification);
  assert.equal(customer.operationalStatus, inactive.operationalStatus);
  const commitment = (
    await sql<
      any[]
    >`SELECT customer_id AS "customerId",owner_employee_id AS "ownerId",source_type AS "sourceType" FROM commitments WHERE id=${result.commitmentId}`
  )[0];
  assert.equal(commitment.customerId, inactive.id);
  assert.equal(commitment.ownerId, actor.id);
  assert.equal(commitment.sourceType, "reactivation");
  assert.ok(
    (await repo.listAudit()).some(
      (x) =>
        x.action === "customer.reactivation_initiated" &&
        x.resourceId === inactive.id,
    ),
  );
});

test.after(async () => {
  await sql.end();
});
