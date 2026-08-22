import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { hashPassword } from "../src/password";

const url = process.env.DATABASE_URL, password = process.env.SALES_BOOTSTRAP_PASSWORD;
if (!url || !password) throw new Error("DATABASE_URL and SALES_BOOTSTRAP_PASSWORD are required.");
const sql = postgres(url);
const rep = (await sql<any[]>`SELECT id,organization_id AS "organizationId",team_id AS "teamId" FROM employees WHERE email='rep@local.test'`)[0];
if (!rep) throw new Error("Run Phase 0 bootstrap first.");
const employeeId = randomUUID();
await sql`INSERT INTO employees(id,organization_id,team_id,email,display_name,password_hash,role) VALUES(${employeeId},${rep.organizationId},${rep.teamId},'telesales@local.test','DEVELOPMENT/TEST telesales employee',${await hashPassword(password)},'telesales_employee')`;
const customers:string[]=[];
for (const [index,name] of ["DEVELOPMENT/TEST priority customer","DEVELOPMENT/TEST collection customer","DEVELOPMENT/TEST follow-up customer"].entries()) {
  const id=randomUUID(); customers.push(id);
  await sql`INSERT INTO customers(id,organization_id,owner_employee_id,owner_team_id,customer_code,name,classification,operational_status,is_active,contact_name,phone,operational_notes) VALUES(${id},${rep.organizationId},${employeeId},${rep.teamId},${`TEL-DEV-${index+1}`},${name},'follow_up',${index===2?'risk':'attention'},${index!==2},'DEVELOPMENT/TEST contact',${`0100000000${index}`},'Development/test telesales context only')`;
}
const scenarios:[string,string,string][]=[['supervisor_priority','DEVELOPMENT/TEST supervisor priority','0'],['collection','DEVELOPMENT/TEST due payment promise','1'],['complaint_followup','DEVELOPMENT/TEST open complaint','0'],['reactivation','DEVELOPMENT/TEST reactivation','2'],['opportunity','DEVELOPMENT/TEST opportunity','0'],['routine','DEVELOPMENT/TEST routine','1']];
for (const [purpose,reason,index] of scenarios) { const id=randomUUID(), customerId=customers[Number(index)%customers.length]; await sql`INSERT INTO telesales_calls(id,organization_id,customer_id,owner_employee_id,purpose,priority_reason,scheduled_at,source_type,source_id) VALUES(${id},${rep.organizationId},${customerId},${employeeId},${purpose},${reason},now(),'DEVELOPMENT_TEST',${purpose})`; if(purpose==='reactivation') await sql`INSERT INTO telesales_call_attempts(id,call_id,organization_id,employee_id,attempted_at,outcome,result,evidence) VALUES(${randomUUID()},${id},${rep.organizationId},${employeeId},now()-interval '7 days','no_answer','followup','DEVELOPMENT/TEST historical attempt')`; }
console.log("Created DEVELOPMENT/TEST Phase 3 telesales seed data."); await sql.end();
