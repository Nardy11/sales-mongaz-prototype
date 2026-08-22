import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { hashPassword } from "../src/password";

const databaseUrl = process.env.DATABASE_URL; const password = process.env.SALES_BOOTSTRAP_PASSWORD;
if (!databaseUrl || !password) throw new Error("DATABASE_URL and SALES_BOOTSTRAP_PASSWORD are required for the local Phase 0 bootstrap.");
const sql = postgres(databaseUrl, { max: 1 });
const organizationId = randomUUID(); const teamId = randomUUID(); const employeeId = randomUUID();
await sql.begin(async (transaction) => {
  await transaction`INSERT INTO organizations (id, name) VALUES (${organizationId}, 'Sales Operations')`;
  await transaction`INSERT INTO teams (id, organization_id, name) VALUES (${teamId}, ${organizationId}, 'Sales Team')`;
  await transaction`INSERT INTO employees (id, organization_id, team_id, email, display_name, password_hash, role) VALUES (${employeeId}, ${organizationId}, ${teamId}, 'rep@local.test', 'موظف مبيعات', ${await hashPassword(password)}, 'sales_representative')`;
});
await sql.end(); console.log("Created local Phase 0 sales representative bootstrap account.");
