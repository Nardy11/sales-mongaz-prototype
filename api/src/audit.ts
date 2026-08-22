import type { IdentityRepository } from "./repository";
import { newAuditEvent } from "./repository";
export class AuditService { constructor(private readonly repository: IdentityRepository) {} async record(input: Parameters<typeof newAuditEvent>[0]) { const event = newAuditEvent(input); await this.repository.writeAudit(event); return event; } }
