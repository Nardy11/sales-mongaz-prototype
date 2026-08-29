export const operationalRoles = ["sales_representative", "telesales_employee", "telesales_supervisor", "sales_manager"] as const;
export type OperationalRole = (typeof operationalRoles)[number];
export type Employee = { id: string; organizationId?: string; email: string; displayName: string; passwordHash: string; role: OperationalRole; teamId: string | null; active: boolean; dateOfBirth?: string | null; avatarDataUrl?: string | null };
export type Session = { id: string; employeeId: string; csrfTokenHash: string; expiresAt: Date; revokedAt: Date | null };
export type AuditEvent = { id: string; actorId: string | null; action: string; resourceType: string; resourceId: string | null; before: Record<string, unknown> | null; after: Record<string, unknown> | null; reason: string | null; correlationId: string; createdAt: Date };
