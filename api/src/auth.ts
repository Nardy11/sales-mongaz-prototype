import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuditService } from "./audit";
import type { IdentityRepository } from "./repository";
import type { Employee, OperationalRole } from "./types";
import { verifyPassword } from "./password";
const sessionCookie = "sales_session";
const csrfCookie = "sales_csrf";
const sessionDurationMs = 1000 * 60 * 60 * 8;
export type AuthContext = {
  employee: Employee;
  sessionId: string;
  csrfTokenHash: string;
  csrfToken: string | null;
};
const hashCsrf = (token: string) =>
  createHash("sha256").update(token).digest("hex");
declare module "fastify" {
  interface FastifyRequest {
    auth: AuthContext | null;
    correlationId: string;
  }
}
export class AuthService {
  constructor(
    private readonly repository: IdentityRepository,
    private readonly audit: AuditService,
  ) {}
  async authenticate(request: FastifyRequest): Promise<AuthContext | null> {
    const sessionId = request.cookies[sessionCookie];
    if (!sessionId) return null;
    const session = await this.repository.findSession(sessionId);
    if (!session || session.revokedAt || session.expiresAt <= new Date())
      return null;
    const employee = await this.repository.findEmployeeById(session.employeeId);
    const presentedCsrf = request.cookies[csrfCookie];
    return employee?.active
      ? {
          employee,
          sessionId,
          csrfTokenHash: session.csrfTokenHash,
          csrfToken:
            presentedCsrf && hashCsrf(presentedCsrf) === session.csrfTokenHash
              ? presentedCsrf
              : null,
        }
      : null;
  }
  async login(
    email: string,
    password: string,
    reply: FastifyReply,
    correlationId: string,
  ) {
    const employee = await this.repository.findEmployeeByEmail(email);
    if (
      !employee ||
      !employee.active ||
      !(await verifyPassword(employee.passwordHash, password))
    )
      return null;
    const sessionId = randomUUID();
    const csrfToken = randomBytes(32).toString("base64url");
    await this.repository.createSession({
      id: sessionId,
      employeeId: employee.id,
      csrfTokenHash: hashCsrf(csrfToken),
      expiresAt: new Date(Date.now() + sessionDurationMs),
      revokedAt: null,
    });
    const cookieOptions = {
      httpOnly: true,
      sameSite: "strict" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: sessionDurationMs / 1000,
    };
    reply.setCookie(sessionCookie, sessionId, cookieOptions);
    reply.setCookie(csrfCookie, csrfToken, cookieOptions);
    await this.audit.record({
      actorId: employee.id,
      action: "session.created",
      resourceType: "session",
      resourceId: sessionId,
      before: null,
      after: { role: employee.role },
      reason: null,
      correlationId,
    });
    return { employee, csrfToken };
  }
  async logout(request: FastifyRequest, reply: FastifyReply) {
    if (!request.auth) return;
    await this.repository.revokeSession(request.auth.sessionId);
    reply.clearCookie(sessionCookie, { path: "/" });
    reply.clearCookie(csrfCookie, { path: "/" });
    await this.audit.record({
      actorId: request.auth.employee.id,
      action: "session.revoked",
      resourceType: "session",
      resourceId: request.auth.sessionId,
      before: null,
      after: null,
      reason: null,
      correlationId: request.correlationId,
    });
  }
}
export const requireAuth = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (!request.auth)
    return reply
      .code(401)
      .send({
        error: "UNAUTHENTICATED",
        message: "Authentication is required.",
      });
};
export const requireRole =
  (roles: readonly OperationalRole[]) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.auth)
      return reply
        .code(401)
        .send({
          error: "UNAUTHENTICATED",
          message: "Authentication is required.",
        });
    if (!roles.includes(request.auth.employee.role))
      return reply
        .code(403)
        .send({
          error: "FORBIDDEN",
          message: "This role is not allowed for this action.",
        });
  };
export const requireCsrf = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (
    !request.auth ||
    typeof request.headers["x-csrf-token"] !== "string" ||
    hashCsrf(request.headers["x-csrf-token"]) !== request.auth.csrfTokenHash
  )
    return reply
      .code(403)
      .send({
        error: "CSRF_INVALID",
        message: "A valid CSRF token is required.",
      });
};
