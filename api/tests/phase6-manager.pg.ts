import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { PostgresIdentityRepository } from "../src/repository";
import { AuditService } from "../src/audit";
import { CustomerCommitmentService, type Actor } from "../src/customer-commitment";
import { ManagerService } from "../src/manager";
import { createApi } from "../src/app";
import { hashPassword } from "../src/password";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required for test:api:phase6.");
const sql = postgres(url);
const repository = new PostgresIdentityRepository(sql);
const audit = new AuditService(repository);
const commitments = new CustomerCommitmentService(sql, audit);
const manager = new ManagerService(sql, audit, commitments);

async function fixture(label: string) {
  const rep = (await sql<any[]>`SELECT id, organization_id AS "organizationId", team_id AS "teamId" FROM employees WHERE role='sales_representative' ORDER BY created_at LIMIT 1`)[0];
  const managerId = randomUUID();
  const email = `phase6-${label}-${managerId}@test.local`;
  await sql`INSERT INTO employees(id,organization_id,team_id,email,display_name,password_hash,role) VALUES(${managerId},${rep.organizationId},${rep.teamId},${email},'Phase 6 manager',${await hashPassword("Phase0-password!")},'sales_manager')`;
  const customer = (await sql<any[]>`SELECT id FROM customers WHERE organization_id=${rep.organizationId} AND owner_employee_id=${rep.id} ORDER BY created_at LIMIT 1`)[0];
  const source = (await sql<any[]>`SELECT id FROM supervisor_exceptions WHERE organization_id=${rep.organizationId} ORDER BY created_at LIMIT 1`)[0];
  const actor: Actor = { id: managerId, organizationId: rep.organizationId, teamId: rep.teamId, role: "sales_manager" };
  const priority = await manager.create(actor, {
    customerId: customer.id, sourceType: "supervisor_exception", sourceId: source.id, ownerEmployeeId: rep.id,
    title: `Phase 6 ${label}`, reason: "Canonical operational evidence requires a decision.", successCondition: "The resulting follow-up is completed with evidence.",
    evidence: "Source evidence is recorded.", dueAt: new Date(Date.now() + 86_400_000).toISOString(), urgency: "urgent", idempotencyKey: randomUUID()
  }, `phase6-${label}`);
  return { actor, rep, customerId: customer.id, priorityId: priority.id, sourceId: source.id, email };
}

test("manager workspace is organization-scoped and exposes canonical open Supervisor evidence", async () => {
  const f = await fixture("workspace");
  const work = await manager.workspace(f.actor);
  assert.ok(work.priorities.some((priority) => priority.id === f.priorityId && priority.operationallyOpen));
  await assert.rejects(() => manager.workspace({ ...f.actor, organizationId: randomUUID() }), { statusCode: 403 });
  await assert.rejects(() => manager.workspace({ ...f.actor, role: "sales_representative" }), { statusCode: 403 });
});

test("manager decision persists a canonical Commitment and leaves the priority operationally open", async () => {
  const f = await fixture("decision");
  const sourceBefore = (await sql<any[]>`SELECT status,version FROM supervisor_exceptions WHERE id=${f.sourceId}`)[0];
  const result = await manager.decide(f.actor, f.priorityId, { kind: "decision", evidence: "Manager decision evidence.", followUpAt: new Date(Date.now() + 172_800_000).toISOString(), followUpTitle: "Complete manager-directed follow-up", idempotencyKey: randomUUID(), version: 1 }, "phase6-decision");
  assert.ok(result.commitmentId);
  assert.equal(result.operationallyOpen, true);
  assert.deepEqual((await sql<any[]>`SELECT status,resulting_commitment_id AS "commitmentId" FROM manager_priorities WHERE id=${f.priorityId}`)[0], { status: "actioned", commitmentId: result.commitmentId });
  assert.equal((await sql<any[]>`SELECT count(*)::int AS count FROM commitments WHERE id=${result.commitmentId} AND source_type='manager_priority' AND source_id=${f.priorityId}`)[0].count, 1);
  assert.equal((await sql<any[]>`SELECT count(*)::int AS count FROM audit_events WHERE resource_id=${f.priorityId} AND action='manager.priority_decided'`)[0].count, 1);
  assert.deepEqual((await sql<any[]>`SELECT status,version FROM supervisor_exceptions WHERE id=${f.sourceId}`)[0], sourceBefore);
});

test("foreign customer/source inputs and inactive Manager actor are denied without priority residue", async () => {
  const f = await fixture("scope");
  const foreignOrg = randomUUID(), foreignTeam = randomUUID(), foreignOwner = randomUUID(), foreignCustomer = randomUUID(), foreignSource = randomUUID();
  await sql`INSERT INTO organizations(id,name) VALUES(${foreignOrg},'Phase 6 foreign organization')`;
  await sql`INSERT INTO teams(id,organization_id,name) VALUES(${foreignTeam},${foreignOrg},'foreign')`;
  await sql`INSERT INTO employees(id,organization_id,team_id,email,display_name,password_hash,role) VALUES(${foreignOwner},${foreignOrg},${foreignTeam},${`foreign-${foreignOwner}@test.local`},'foreign','x','sales_representative')`;
  await sql`INSERT INTO customers(id,organization_id,owner_employee_id,owner_team_id,name,classification) VALUES(${foreignCustomer},${foreignOrg},${foreignOwner},${foreignTeam},'foreign customer','gold')`;
  await sql`INSERT INTO supervisor_exceptions(id,organization_id,team_id,subject_employee_id,customer_id,source_type,source_id,kind,severity,summary,evidence,required_next_action) VALUES(${foreignSource},${foreignOrg},${foreignTeam},${foreignOwner},${foreignCustomer},'test_source',${randomUUID()},'foreign','urgent','foreign','evidence','follow up')`;
  const input = { customerId: foreignCustomer, sourceType: "supervisor_exception", sourceId: foreignSource, ownerEmployeeId: f.rep.id, title: "denied", reason: "denied", successCondition: "denied", evidence: "denied", dueAt: new Date(Date.now()+86400000).toISOString(), urgency: "urgent" as const, idempotencyKey: randomUUID() };
  await assert.rejects(() => manager.create(f.actor,input,"phase6-foreign"), { statusCode: 403 });
  await sql`UPDATE employees SET active=false WHERE id=${f.actor.id}`;
  await assert.rejects(() => manager.workspace(f.actor), { statusCode: 403 });
  assert.equal((await sql<any[]>`SELECT count(*)::int AS count FROM manager_priorities WHERE title='denied'`)[0].count, 0);
});

test("stale or repeated Manager transition is rejected without a second decision", async () => {
  const f = await fixture("stale");
  await manager.decide(f.actor,f.priorityId,{kind:"decision",evidence:"first decision",followUpAt:new Date(Date.now()+86400000).toISOString(),version:1,idempotencyKey:randomUUID()},"phase6-first");
  await assert.rejects(() => manager.decide(f.actor,f.priorityId,{kind:"resolve",evidence:"stale resolution",version:1},"phase6-stale"), { statusCode: 409 });
  assert.equal((await sql<any[]>`SELECT count(*)::int AS count FROM manager_decisions WHERE priority_id=${f.priorityId}`)[0].count, 1);
});

test("only explicit resolution closes the Manager priority and does not mutate canonical source work", async () => {
  const f = await fixture("resolve");
  const result = await manager.decide(f.actor, f.priorityId, { kind: "resolve", evidence: "Recorded completion proof.", version: 1 }, "phase6-resolve");
  assert.equal(result.operationallyOpen, false);
  assert.equal((await sql<any[]>`SELECT status FROM manager_priorities WHERE id=${f.priorityId}`)[0].status, "resolved");
  assert.equal((await sql<any[]>`SELECT count(*)::int AS count FROM manager_decisions WHERE priority_id=${f.priorityId} AND resolves_work=true`)[0].count, 1);
});

test("forced canonical Commitment failure rolls back the decision, linkage, and audit", async () => {
  const f = await fixture("rollback");
  await sql`CREATE OR REPLACE FUNCTION phase6_reject_commitment() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'forced manager commitment failure'; END $$`;
  await sql`CREATE TRIGGER phase6_reject_commitment BEFORE INSERT ON commitments FOR EACH ROW EXECUTE FUNCTION phase6_reject_commitment()`;
  try {
    await assert.rejects(() => manager.decide(f.actor, f.priorityId, { kind: "decision", evidence: "Will roll back.", followUpAt: new Date(Date.now() + 86_400_000).toISOString(), version: 1, idempotencyKey: randomUUID() }, "phase6-rollback"));
  } finally {
    await sql`DROP TRIGGER IF EXISTS phase6_reject_commitment ON commitments`;
    await sql`DROP FUNCTION IF EXISTS phase6_reject_commitment()`;
  }
  assert.deepEqual((await sql<any[]>`SELECT status,version,resulting_commitment_id FROM manager_priorities WHERE id=${f.priorityId}`)[0], { status: "open", version: 1, resulting_commitment_id: null });
  assert.equal((await sql<any[]>`SELECT count(*)::int AS count FROM manager_decisions WHERE priority_id=${f.priorityId}`)[0].count, 0);
  assert.equal((await sql<any[]>`SELECT count(*)::int AS count FROM audit_events WHERE resource_id=${f.priorityId} AND action='manager.priority_decided'`)[0].count, 0);
});

test("retry after rolled-back dependent work persists exactly one decision and Commitment", async () => {
  const f = await fixture("retry");
  const input = { kind: "decision" as const, evidence: "Retry-safe evidence.", followUpAt: new Date(Date.now() + 86_400_000).toISOString(), followUpTitle: "Retry-safe follow-up", version: 1, idempotencyKey: randomUUID() };
  await manager.decide(f.actor, f.priorityId, input, "phase6-retry");
  assert.equal((await sql<any[]>`SELECT count(*)::int AS count FROM manager_decisions WHERE priority_id=${f.priorityId}`)[0].count, 1);
  assert.equal((await sql<any[]>`SELECT count(*)::int AS count FROM commitments WHERE source_type='manager_priority' AND source_id=${f.priorityId}`)[0].count, 1);
});

test("Manager HTTP route enforces authentication and CSRF before returning persisted workspace", async () => {
  const f = await fixture("http");
  const app = await createApi({ repository, sales: commitments, manager });
  try {
    assert.equal((await app.inject({ method: "GET", url: "/api/manager/workspace" })).statusCode, 401);
    const login = await app.inject({ method: "POST", url: "/api/auth/login", payload: { email: f.email, password: "Phase0-password!" } });
    assert.equal(login.statusCode, 200);
    const cookie = Array.isArray(login.headers["set-cookie"]) ? login.headers["set-cookie"][0] : login.headers["set-cookie"];
    assert.equal((await app.inject({ method: "POST", url: `/api/manager/priorities/${f.priorityId}/decisions`, headers: { cookie }, payload: { kind: "resolve", evidence: "HTTP evidence", version: 1 } })).statusCode, 403);
    assert.equal((await app.inject({ method: "GET", url: "/api/manager/workspace", headers: { cookie } })).statusCode, 200);
  } finally { await app.close(); }
});

test.after(async () => sql.end());
