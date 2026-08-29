import { randomUUID } from "node:crypto";
import postgres, { type Sql } from "postgres";
import type { AuditEvent, Employee, Session } from "./types";

export interface IdentityRepository {
  findEmployeeByEmail(email: string): Promise<Employee | null>; findEmployeeById(id: string): Promise<Employee | null>;
  updateEmployeeProfile(id: string, input: { displayName: string; dateOfBirth: string | null; avatarDataUrl: string | null }): Promise<Employee | null>;
  createSession(session: Session): Promise<void>; findSession(id: string): Promise<Session | null>; revokeSession(id: string): Promise<void>;
  writeAudit(event: AuditEvent): Promise<void>; listAudit(): Promise<AuditEvent[]>;
}
export class InMemoryIdentityRepository implements IdentityRepository {
  private readonly sessions = new Map<string, Session>(); private readonly audit: AuditEvent[] = [];
  constructor(private readonly employees: Employee[]) {}
  async findEmployeeByEmail(email: string) { return this.employees.find((employee) => employee.email.toLowerCase() === email.toLowerCase()) ?? null; }
  async findEmployeeById(id: string) { return this.employees.find((employee) => employee.id === id) ?? null; }
  async updateEmployeeProfile(id: string, input: { displayName: string; dateOfBirth: string | null; avatarDataUrl: string | null }) { const index=this.employees.findIndex((employee)=>employee.id===id); if(index<0)return null; const employee={...this.employees[index],...input}; this.employees[index]=employee; return employee; }
  async createSession(session: Session) { this.sessions.set(session.id, session); }
  async findSession(id: string) { return this.sessions.get(id) ?? null; }
  async revokeSession(id: string) { const session = this.sessions.get(id); if (session) this.sessions.set(id, { ...session, revokedAt: new Date() }); }
  async writeAudit(event: AuditEvent) { this.audit.push(event); }
  async listAudit() { return [...this.audit]; }
}
export const newAuditEvent = (input: Omit<AuditEvent, "id" | "createdAt">): AuditEvent => ({ ...input, id: randomUUID(), createdAt: new Date() });

export class PostgresIdentityRepository implements IdentityRepository {
  constructor(private readonly sql: Sql) {}
  async findEmployeeByEmail(email: string) { const rows = await this.sql<Employee[]>`SELECT id, organization_id AS "organizationId", email, display_name AS "displayName", password_hash AS "passwordHash", role, team_id AS "teamId", active, date_of_birth::text AS "dateOfBirth", avatar_data_url AS "avatarDataUrl" FROM employees WHERE lower(email) = lower(${email}) LIMIT 1`; return rows[0] ?? null; }
  async findEmployeeById(id: string) { const rows = await this.sql<Employee[]>`SELECT id, organization_id AS "organizationId", email, display_name AS "displayName", password_hash AS "passwordHash", role, team_id AS "teamId", active, date_of_birth::text AS "dateOfBirth", avatar_data_url AS "avatarDataUrl" FROM employees WHERE id = ${id} LIMIT 1`; return rows[0] ?? null; }
  async updateEmployeeProfile(id: string, input: { displayName: string; dateOfBirth: string | null; avatarDataUrl: string | null }) { const rows=await this.sql<Employee[]>`UPDATE employees SET display_name=${input.displayName}, date_of_birth=${input.dateOfBirth}, avatar_data_url=${input.avatarDataUrl}, updated_at=now() WHERE id=${id} RETURNING id, organization_id AS "organizationId", email, display_name AS "displayName", password_hash AS "passwordHash", role, team_id AS "teamId", active, date_of_birth::text AS "dateOfBirth", avatar_data_url AS "avatarDataUrl"`; return rows[0]??null; }
  async createSession(session: Session) { await this.sql`INSERT INTO sessions (id, employee_id, csrf_token_hash, expires_at, revoked_at) VALUES (${session.id}, ${session.employeeId}, ${session.csrfTokenHash}, ${session.expiresAt}, ${session.revokedAt})`; }
  async findSession(id: string) { const rows = await this.sql<Session[]>`SELECT id, employee_id AS "employeeId", csrf_token_hash AS "csrfTokenHash", expires_at AS "expiresAt", revoked_at AS "revokedAt" FROM sessions WHERE id = ${id} LIMIT 1`; return rows[0] ?? null; }
  async revokeSession(id: string) { await this.sql`UPDATE sessions SET revoked_at = now() WHERE id = ${id} AND revoked_at IS NULL`; }
  async writeAudit(event: AuditEvent) { await this.sql`INSERT INTO audit_events (id, actor_employee_id, action, resource_type, resource_id, before_data, after_data, reason, correlation_id, created_at) VALUES (${event.id}, ${event.actorId}, ${event.action}, ${event.resourceType}, ${event.resourceId}, ${event.before}, ${event.after}, ${event.reason}, ${event.correlationId}, ${event.createdAt})`; }
  async listAudit() { return this.sql<AuditEvent[]>`SELECT id, actor_employee_id AS "actorId", action, resource_type AS "resourceType", resource_id AS "resourceId", before_data AS before, after_data AS after, reason, correlation_id AS "correlationId", created_at AS "createdAt" FROM audit_events ORDER BY created_at`; }
}

export const connectIdentityRepository = (databaseUrl: string) => { const sql = postgres(databaseUrl, { max: 10 }); return { repository: new PostgresIdentityRepository(sql), close: () => sql.end() }; };
