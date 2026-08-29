import { randomUUID } from "node:crypto";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { z } from "zod";
import { AuditService } from "./audit";
import { AuthService, requireAuth, requireCsrf, requireRole } from "./auth";
import type { IdentityRepository } from "./repository";
import { CustomerCommitmentService } from "./customer-commitment";
import { RepresentativeService } from "./representative";
import { TelesalesService } from "./telesales";
import { OrderLifecycleService } from "./order-lifecycle";
import { ComplaintLifecycleService } from "./complaint-lifecycle";
import { SupervisorService } from "./supervisor";
import { ManagerService } from "./manager";
import { ReportingService } from "./reporting";

export const createApi = async ({
  repository,
  sales,
  representative,
  telesales,
  orders,
  complaints,
  supervisor,
  manager,
  reporting,
  allowedOrigin = "http://localhost:5173",
}: {
  repository: IdentityRepository;
  sales?: CustomerCommitmentService;
  representative?: RepresentativeService;
  telesales?: TelesalesService;
  orders?: OrderLifecycleService;
  complaints?: ComplaintLifecycleService;
  supervisor?: SupervisorService;
  manager?: ManagerService;
  reporting?: ReportingService;
  allowedOrigin?: string;
}) => {
  const app = Fastify({
    logger: false,
    requestIdHeader: "x-request-id",
    genReqId: () => randomUUID(),
  });
  const audit = new AuditService(repository);
  const auth = new AuthService(repository, audit);
  await app.register(cookie);
  await app.register(cors, {
    origin: allowedOrigin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
  });
  await app.register(rateLimit, { global: false });
  app.addHook("preHandler", async (request) => {
    request.correlationId = request.id;
    request.auth = await auth.authenticate(request);
  });
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof z.ZodError)
      return reply
        .code(422)
        .send({
          error: "VALIDATION_ERROR",
          message: "Invalid request data.",
          correlationId: request.correlationId,
        });
    return reply
      .code(error.statusCode ?? 500)
      .send({
        error: "REQUEST_FAILED",
        message:
          error.statusCode && error.statusCode < 500
            ? error.message
            : "Unexpected server error.",
        correlationId: request.correlationId,
      });
  });
  app.get("/health", async (request) => ({
    status: "ok",
    service: "sales-api",
    correlationId: request.correlationId,
  }));
  app.post(
    "/api/auth/login",
    { config: { rateLimit: { max: 8, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const input = z
        .object({ email: z.email(), password: z.string().min(12).max(256) })
        .parse(request.body);
      const result = await auth.login(
        input.email,
        input.password,
        reply,
        request.correlationId,
      );
      if (!result)
        return reply
          .code(401)
          .send({
            error: "INVALID_CREDENTIALS",
            message: "Invalid email or password.",
          });
      return {
        employee: {
          id: result.employee.id,
          displayName: result.employee.displayName,
          role: result.employee.role,
        },
        csrfToken: result.csrfToken,
      };
    },
  );
  app.get(
    "/api/auth/me",
    { preHandler: requireAuth },
    async (request, reply) => {
      if (!request.auth!.csrfToken)
        return reply.code(401).send({
          error: "SESSION_REFRESH_REQUIRED",
          message: "Please sign in again to restore secure write access.",
          correlationId: request.correlationId,
        });
      return {
        employee: request.auth!.employee,
        csrfToken: request.auth!.csrfToken,
      };
    },
  );
  app.post(
    "/api/auth/logout",
    { preHandler: [requireAuth, requireCsrf] },
    async (request, reply) => {
      await auth.logout(request, reply);
      return reply.code(204).send();
    },
  );
  const profile = (employee: any) => ({
    id: employee.id,
    displayName: employee.displayName,
    email: employee.email,
    role: employee.role,
    active: employee.active,
    dateOfBirth: employee.dateOfBirth ?? null,
    avatarDataUrl: employee.avatarDataUrl ?? null,
  });
  app.get("/api/profile", { preHandler: requireAuth }, async (request) =>
    profile(request.auth!.employee),
  );
  app.patch(
    "/api/profile",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      const input = z
        .object({
          displayName: z.string().trim().min(2).max(120),
          dateOfBirth: z.string().date().nullable(),
          avatarDataUrl: z
            .string()
            .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/)
            .max(450_000)
            .nullable(),
        })
        .parse(request.body);
      const before = profile(request.auth!.employee);
      const employee = await repository.updateEmployeeProfile(
        request.auth!.employee.id,
        input,
      );
      if (!employee)
        return reply
          .code(404)
          .send({ error: "NOT_FOUND", message: "Profile is not available." });
      await audit.record({
        actorId: employee.id,
        action: "employee.profile_updated",
        resourceType: "employee",
        resourceId: employee.id,
        before,
        after: profile(employee),
        reason: null,
        correlationId: request.correlationId,
      });
      return profile(employee);
    },
  );
  app.get(
    "/api/foundation/role-check",
    { preHandler: [requireAuth, requireRole(["sales_manager"])] },
    async (request) => ({ role: request.auth!.employee.role, allowed: true }),
  );
  const actor = (request: any) => ({
    id: request.auth!.employee.id,
    organizationId: request.auth!.employee.organizationId,
    teamId: request.auth!.employee.teamId,
    role: request.auth!.employee.role,
  });
  const salesReady = (reply: any) => {
    if (!sales) {
      reply
        .code(503)
        .send({
          error: "SALES_STORE_UNAVAILABLE",
          message: "Persistent sales storage is required.",
        });
      return false;
    }
    return true;
  };
  app.get(
    "/api/customers",
    { preHandler: requireAuth },
    async (request: any, reply) => {
      if (!salesReady(reply)) return;
      return sales!.listCustomers(actor(request), (request.query as any)?.q);
    },
  );
  app.get(
    "/api/customers/:id",
    { preHandler: requireAuth },
    async (request: any, reply) => {
      if (!salesReady(reply)) return;
      const result = await sales!.customerDetail(
        actor(request),
        request.params.id,
      );
      return (
        result ??
        reply
          .code(404)
          .send({ error: "NOT_FOUND", message: "Customer is not accessible." })
      );
    },
  );
  app.post(
    "/api/customers",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!salesReady(reply)) return;
      const input = z
        .object({
          name: z.string().min(2).max(160),
          customerCode: z.string().max(50).optional(),
          classification: z.enum(["gold", "silver", "follow_up"]),
          operationalStatus: z.enum(["normal", "attention", "risk"]).optional(),
          isActive: z.boolean().optional(),
          contactName: z.string().max(120).optional(),
          phone: z.string().max(40).optional(),
          email: z.email().optional(),
          address: z.string().max(250).optional(),
          city: z.string().max(100).optional(),
          operationalNotes: z.string().max(1000).optional(),
          ownerEmployeeId: z.string().uuid().optional(),
        })
        .parse(request.body);
      return reply
        .code(201)
        .send(
          await sales!.createCustomer(
            actor(request),
            input,
            request.correlationId,
          ),
        );
    },
  );
  app.patch(
    "/api/customers/:id",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!salesReady(reply)) return;
      const input = z
        .object({
          name: z.string().min(2).max(160).optional(),
          customerCode: z.string().max(50).optional(),
          classification: z.enum(["gold", "silver", "follow_up"]).optional(),
          operationalStatus: z.enum(["normal", "attention", "risk"]).optional(),
          isActive: z.boolean().optional(),
          contactName: z.string().max(120).optional(),
          phone: z.string().max(40).optional(),
          email: z.email().optional(),
          address: z.string().max(250).optional(),
          city: z.string().max(100).optional(),
          operationalNotes: z.string().max(1000).optional(),
          ownerEmployeeId: z.string().uuid().optional(),
        })
        .refine((value) => Object.keys(value).length > 0)
        .parse(request.body);
      return sales!.updateCustomer(
        actor(request),
        request.params.id,
        input,
        request.correlationId,
      );
    },
  );
  app.post(
    "/api/commitments",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!salesReady(reply)) return;
      const input = z
        .object({
          customerId: z.string().uuid(),
          ownerEmployeeId: z.string().uuid().optional(),
          kind: z.enum(["follow_up", "customer_care", "internal"]),
          title: z.string().min(2).max(180),
          dueAt: z.string().datetime(),
          urgency: z.enum(["normal", "caution", "urgent"]).optional(),
          sourceType: z.string().max(80).optional(),
          sourceId: z.string().max(100).optional(),
          sourceEvidence: z.string().max(1000).optional(),
          idempotencyKey: z.string().uuid(),
        })
        .parse(request.body);
      return reply
        .code(201)
        .send(
          await sales!.createCommitment(
            actor(request),
            input,
            request.correlationId,
          ),
        );
    },
  );
  app.post(
    "/api/commitments/:id/complete",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!salesReady(reply)) return;
      const input = z
        .object({
          evidence: z.string().min(2).max(1000),
          resulting: z
            .object({
              ownerEmployeeId: z.string().uuid().optional(),
              kind: z.enum(["follow_up", "customer_care", "internal"]),
              title: z.string().min(2).max(180),
              dueAt: z.string().datetime(),
              urgency: z.enum(["normal", "caution", "urgent"]).optional(),
              idempotencyKey: z.string().uuid(),
            })
            .optional(),
        })
        .parse(request.body);
      return sales!.completeCommitment(
        actor(request),
        request.params.id,
        input,
        request.correlationId,
      );
    },
  );
  const repReady = (reply: any) => {
    if (!representative) {
      reply
        .code(503)
        .send({
          error: "SALES_STORE_UNAVAILABLE",
          message: "Persistent sales storage is required.",
        });
      return false;
    }
    return true;
  };
  const repOnly = (request: any) => {
    if (request.auth!.employee.role !== "sales_representative")
      throw Object.assign(new Error("Representative role required."), {
        statusCode: 403,
      });
  };
  app.get(
    "/api/representative/day",
    { preHandler: requireAuth },
    async (request: any, reply) => {
      if (!repReady(reply)) return;
      repOnly(request);
      return representative!.day(actor(request));
    },
  );
  app.get(
    "/api/representative/activity",
    { preHandler: requireAuth },
    async (request: any, reply) => {
      if (!repReady(reply)) return;
      repOnly(request);
      return representative!.activity(actor(request));
    },
  );
  app.get(
    "/api/products",
    { preHandler: requireAuth },
    async (request: any, reply) => {
      if (!repReady(reply)) return;
      repOnly(request);
      return representative!.products(actor(request));
    },
  );
  app.post(
    "/api/customers/:id/reactivation",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!repReady(reply)) return;
      repOnly(request);
      const input = z
        .object({
          evidence: z.string().min(2).max(1000),
          title: z.string().min(2).max(180),
          dueAt: z.string().datetime(),
        })
        .parse(request.body);
      return reply
        .code(201)
        .send(
          await representative!.reactivate(
            actor(request),
            request.params.id,
            input,
            request.correlationId,
          ),
        );
    },
  );
  app.post(
    "/api/visits",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!repReady(reply)) return;
      repOnly(request);
      const input = z
        .object({
          customerId: z.string().uuid(),
          plannedAt: z.string().datetime(),
          purpose: z.string().min(2),
          idempotencyKey: z.string().uuid(),
        })
        .parse(request.body);
      return reply
        .code(201)
        .send(
          await representative!.createVisit(
            actor(request),
            input,
            request.correlationId,
          ),
        );
    },
  );
  app.post(
    "/api/visits/:id/start",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!repReady(reply)) return;
      repOnly(request);
      return representative!.startVisit(
        actor(request),
        request.params.id,
        request.correlationId,
      );
    },
  );
  app.post(
    "/api/visits/:id/complete",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!repReady(reply)) return;
      repOnly(request);
      const input = z
        .object({
          outcome: z.string().min(2),
          evidence: z.string().min(2),
          notes: z.string().optional(),
          followUpTitle: z.string().min(2).optional(),
          followUpDueAt: z.string().datetime().optional(),
        })
        .parse(request.body);
      return representative!.completeVisit(
        actor(request),
        request.params.id,
        input,
        request.correlationId,
      );
    },
  );
  app.post(
    "/api/orders",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!repReady(reply)) return;
      repOnly(request);
      const input = z
        .object({
          customerId: z.string().uuid(),
          visitId: z.string().uuid().optional(),
          productId: z.string().uuid(),
          quantity: z.number().positive(),
          unitPrice: z.number().nonnegative().optional(),
          requestNote: z.string().optional(),
          duplicateOverrideReason: z.string().min(2).optional(),
          requiresCreditReview: z.boolean().optional(),
        })
        .parse(request.body);
      return reply
        .code(201)
        .send(
          await representative!.createOrder(
            actor(request),
            input,
            request.correlationId,
          ),
        );
    },
  );
  for (const type of [
    "opportunity",
    "complaint",
    "observation",
    "collection",
  ] as const)
    app.post(
      `/api/${type}s`,
      { preHandler: [requireAuth, requireCsrf] },
      async (request: any, reply) => {
        if (!repReady(reply)) return;
        repOnly(request);
        const input = z
          .object({
            customerId: z.string().uuid(),
            visitId: z.string().uuid().optional(),
            kind: z.string().min(1).optional(),
            productReference: z.string().optional(),
            note: z.string().optional(),
            classification: z.string().optional(),
            description: z.string().optional(),
            responsibleParty: z.string().optional(),
            requiredAction: z.string().optional(),
            observationType: z.string().optional(),
            competitor: z.string().optional(),
            competitorPrice: z.number().nonnegative().optional(),
            offer: z.string().optional(),
            outcome: z
              .enum(["collected", "partial", "promise", "no_collection"])
              .optional(),
            amountCollected: z.number().nonnegative().optional(),
            promiseAmount: z.number().positive().optional(),
            promiseDueAt: z.string().datetime().optional(),
            evidence: z.string().optional(),
            followUpTitle: z.string().optional(),
            followUpDueAt: z.string().datetime().optional(),
          })
          .parse(request.body);
        return reply
          .code(201)
          .send(
            await representative!.capture(
              actor(request),
              type,
              input,
              request.correlationId,
            ),
          );
      },
    );
  const telesalesOnly = (request: any) => {
    if (request.auth!.employee.role !== "telesales_employee")
      throw Object.assign(new Error("Telesales role required."), {
        statusCode: 403,
      });
  };
  app.get(
    "/api/telesales/queue",
    { preHandler: requireAuth },
    async (request: any, reply) => {
      if (!telesales)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      telesalesOnly(request);
      return telesales.queue(actor(request));
    },
  );
  app.get(
    "/api/telesales/day",
    { preHandler: requireAuth },
    async (request: any, reply) => {
      if (!telesales)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      telesalesOnly(request);
      return telesales.day(actor(request));
    },
  );
  app.get(
    "/api/telesales/activity",
    { preHandler: requireAuth },
    async (request: any, reply) => {
      if (!telesales)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      telesalesOnly(request);
      return telesales.activity(actor(request));
    },
  );
  app.get(
    "/api/telesales/calls/:id",
    { preHandler: requireAuth },
    async (request: any, reply) => {
      if (!telesales)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      telesalesOnly(request);
      return telesales.detail(actor(request), request.params.id);
    },
  );
  app.post(
    "/api/telesales/calls/:id/start",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!telesales)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      telesalesOnly(request);
      return telesales.start(
        actor(request),
        request.params.id,
        request.correlationId,
      );
    },
  );
  app.post(
    "/api/telesales/calls/:id/complete",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!telesales)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      telesalesOnly(request);
      const input = z
        .object({
          outcome: z.enum([
            "successful_contact",
            "payment_promise",
            "complaint",
            "callback",
            "no_answer",
            "not_interested",
          ]),
          evidence: z.string().min(2),
          callbackAt: z.string().datetime().optional(),
        })
        .parse(request.body);
      return telesales.complete(
        actor(request),
        request.params.id,
        input,
        request.correlationId,
      );
    },
  );
  app.get(
    "/api/telesales/products",
    { preHandler: requireAuth },
    async (request: any, reply) => {
      if (!telesales || !representative)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      telesalesOnly(request);
      return representative.products(actor(request));
    },
  );
  app.post(
    "/api/telesales/calls/:id/order",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!telesales || !representative)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      telesalesOnly(request);
      const live = await telesales.ensureLive(
        actor(request),
        request.params.id,
      );
      const input = z
        .object({
          productId: z.string().uuid(),
          quantity: z.number().positive(),
          unitPrice: z.number().nonnegative().optional(),
          requestNote: z.string().max(1000).optional(),
          duplicateOverrideReason: z.string().min(2).optional(),
        })
        .parse(request.body);
      return reply
        .code(201)
        .send(
          await representative.createOrder(
            actor(request),
            { ...input, customerId: live.customerId },
            request.correlationId,
          ),
        );
    },
  );
  app.post(
    "/api/telesales/calls/:id/:capture",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!telesales || !representative)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      telesalesOnly(request);
      const kind = z
        .enum(["collection", "complaint", "opportunity"])
        .parse(request.params.capture);
      const live = await telesales.ensureLive(
        actor(request),
        request.params.id,
      );
      const input = z
        .object({
          evidence: z.string().min(2).max(1000),
          note: z.string().max(1000).optional(),
          description: z.string().max(1000).optional(),
          classification: z.string().max(80).optional(),
          responsibleParty: z.string().max(180).optional(),
          requiredAction: z.string().max(500).optional(),
          kind: z.string().max(80).optional(),
          productReference: z.string().max(120).optional(),
          outcome: z.enum(["promise"]).optional(),
          promiseAmount: z.number().positive().optional(),
          promiseDueAt: z.string().datetime().optional(),
          followUpTitle: z.string().min(2).max(180).optional(),
          followUpDueAt: z.string().datetime().optional(),
        })
        .parse(request.body);
      if (kind === "collection" && input.outcome !== "promise")
        throw Object.assign(new Error("Payment promise is required."), {
          statusCode: 422,
        });
      return reply
        .code(201)
        .send(
          await representative.capture(
            actor(request),
            kind,
            { ...input, customerId: live.customerId },
            request.correlationId,
          ),
        );
    },
  );
  app.post(
    "/api/telesales/calls/:id/reactivation",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!telesales || !representative)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      telesalesOnly(request);
      const live = await telesales.ensureLive(
        actor(request),
        request.params.id,
      );
      const input = z
        .object({
          evidence: z.string().min(2).max(1000),
          title: z.string().min(2).max(180),
          dueAt: z.string().datetime(),
        })
        .parse(request.body);
      return reply
        .code(201)
        .send(
          await representative.reactivate(
            actor(request),
            live.customerId,
            input,
            request.correlationId,
          ),
        );
    },
  );
  app.get(
    "/api/orders/:id/lifecycle",
    { preHandler: requireAuth },
    async (request: any, reply) => {
      if (!orders)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      return orders.detail(actor(request), request.params.id);
    },
  );
  app.post(
    "/api/orders/:id/lifecycle",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!orders)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      const input = z
        .object({
          to: z.enum([
            "credit_review",
            "approved",
            "preparation",
            "delivery_preparation",
            "delivered",
            "closed",
          ]),
          evidence: z.string().min(2).max(1000),
          responsibleParty: z.string().min(2).max(180).optional(),
          followUpAt: z.string().datetime().optional(),
          version: z.number().int().nonnegative(),
        })
        .parse(request.body);
      return orders.transition(
        actor(request),
        request.params.id,
        input,
        request.correlationId,
      );
    },
  );
  app.post(
    "/api/orders/:id/block",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!orders)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      const input = z
        .object({
          reason: z.string().min(2).max(500),
          responsibleParty: z.string().min(2).max(180),
          requiredNextAction: z.string().min(2).max(500),
          evidence: z.string().min(2).max(1000),
          followUpAt: z.string().datetime().optional(),
          createFollowUp: z.boolean().optional(),
          followUpIdempotencyKey: z.string().uuid().optional(),
          version: z.number().int().nonnegative(),
        })
        .parse(request.body);
      return orders.block(
        actor(request),
        request.params.id,
        input,
        request.correlationId,
      );
    },
  );
  app.post(
    "/api/orders/:id/unblock",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!orders)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      const input = z
        .object({
          evidence: z.string().min(2).max(1000),
          version: z.number().int().nonnegative(),
        })
        .parse(request.body);
      return orders.unblock(
        actor(request),
        request.params.id,
        input,
        request.correlationId,
      );
    },
  );
  app.get(
    "/api/complaints/:id/lifecycle",
    { preHandler: requireAuth },
    async (request: any, reply) => {
      if (!complaints)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      return complaints.detail(actor(request), request.params.id);
    },
  );
  app.post(
    "/api/complaints/:id/lifecycle",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!complaints)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      const input = z
        .object({
          to: z.enum([
            "classified",
            "assigned",
            "corrective_action",
            "follow_up",
            "resolved",
            "closed",
          ]),
          evidence: z.string().min(2).max(1000),
          classification: z.string().min(2).max(80).optional(),
          responsibleParty: z.string().min(2).max(180).optional(),
          correctiveAction: z.string().min(2).max(1000).optional(),
          followUpAt: z.string().datetime().optional(),
          followUpTitle: z.string().min(2).max(180).optional(),
          createFollowUp: z.boolean().optional(),
          followUpIdempotencyKey: z.string().uuid().optional(),
          version: z.number().int().nonnegative(),
        })
        .parse(request.body);
      return complaints.transition(
        actor(request),
        request.params.id,
        input,
        request.correlationId,
      );
    },
  );
  const supervisorOnly = (request: any) => {
    if (request.auth!.employee.role !== "telesales_supervisor")
      throw Object.assign(new Error("Telesales Supervisor role required."), {
        statusCode: 403,
      });
  };
  app.get(
    "/api/supervisor/workspace",
    { preHandler: requireAuth },
    async (request: any, reply) => {
      if (!supervisor)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      supervisorOnly(request);
      return supervisor.workspace(actor(request));
    },
  );
  app.post(
    "/api/supervisor/checkpoints",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!supervisor)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      supervisorOnly(request);
      const input = z
        .object({
          checkpoint: z.enum(["morning", "midday", "end_of_day"]),
          evidence: z.string().min(2).max(1000),
          readinessState: z.enum(["ready", "attention", "risk"]),
        })
        .parse(request.body);
      return reply
        .code(201)
        .send(
          await supervisor.recordCheckpoint(
            actor(request),
            input,
            request.correlationId,
          ),
        );
    },
  );
  app.post(
    "/api/supervisor/exceptions/:id/actions",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!supervisor)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      supervisorOnly(request);
      const input = z
        .object({
          kind: z.enum([
            "acknowledge",
            "escalate",
            "reassign",
            "follow_up",
            "resolve",
          ]),
          evidence: z.string().min(2).max(1000),
          followUpAt: z.string().datetime().optional(),
          followUpTitle: z.string().min(2).max(180).optional(),
          ownerEmployeeId: z.string().uuid().optional(),
          version: z.number().int().positive(),
          idempotencyKey: z.string().uuid().optional(),
        })
        .parse(request.body);
      return supervisor.action(
        actor(request),
        request.params.id,
        input,
        request.correlationId,
      );
    },
  );
  app.post(
    "/api/supervisor/quality-reviews",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!supervisor)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      supervisorOnly(request);
      const input = z
        .object({
          employeeId: z.string().uuid(),
          sourceType: z.string().min(2).max(80),
          sourceId: z.string().min(2).max(100),
          evidence: z.string().min(2).max(1000),
          result: z.enum(["ready", "needs_improvement"]),
          observation: z.string().min(2).max(1000),
        })
        .parse(request.body);
      return reply
        .code(201)
        .send(
          await supervisor.qualityReview(
            actor(request),
            input,
            request.correlationId,
          ),
        );
    },
  );
  app.post(
    "/api/supervisor/coaching",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!supervisor)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      supervisorOnly(request);
      const input = z
        .object({
          employeeId: z.string().uuid(),
          sourceType: z.string().min(2).max(80),
          sourceId: z.string().min(2).max(100),
          topic: z.string().min(2).max(180),
          evidence: z.string().min(2).max(1000),
          agreedAction: z.string().min(2).max(500),
          dueAt: z.string().datetime().optional(),
          createFollowUp: z.boolean().optional(),
          idempotencyKey: z.string().uuid().optional(),
        })
        .parse(request.body);
      return reply
        .code(201)
        .send(
          await supervisor.coach(actor(request), input, request.correlationId),
        );
    },
  );
  const managerOnly = (request: any) => {
    if (request.auth!.employee.role !== "sales_manager")
      throw Object.assign(new Error("Sales Manager role required."), {
        statusCode: 403,
      });
  };
  app.get(
    "/api/manager/workspace",
    { preHandler: requireAuth },
    async (request: any, reply) => {
      if (!manager)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      managerOnly(request);
      return manager.workspace(actor(request));
    },
  );
  app.post(
    "/api/manager/priorities",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!manager)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      managerOnly(request);
      const input = z
        .object({
          customerId: z.string().uuid().optional(),
          sourceType: z.string().max(80).optional(),
          sourceId: z.string().max(100).optional(),
          ownerEmployeeId: z.string().uuid().optional(),
          title: z.string().min(2).max(180),
          reason: z.string().min(2).max(1000),
          successCondition: z.string().min(2).max(500),
          evidence: z.string().min(2).max(1000),
          dueAt: z.string().datetime(),
          urgency: z.enum(["normal", "caution", "urgent"]),
          idempotencyKey: z.string().uuid(),
        })
        .parse(request.body);
      return reply
        .code(201)
        .send(
          await manager.create(actor(request), input, request.correlationId),
        );
    },
  );
  app.post(
    "/api/manager/priorities/:id/decisions",
    { preHandler: [requireAuth, requireCsrf] },
    async (request: any, reply) => {
      if (!manager)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      managerOnly(request);
      const input = z
        .object({
          kind: z.enum(["decision", "resolve"]),
          evidence: z.string().min(2).max(1000),
          followUpAt: z.string().datetime().optional(),
          followUpTitle: z.string().min(2).max(180).optional(),
          idempotencyKey: z.string().uuid().optional(),
          version: z.number().int().positive(),
        })
        .parse(request.body);
      return manager.decide(
        actor(request),
        request.params.id,
        input,
        request.correlationId,
      );
    },
  );
  app.get(
    "/api/manager/reports",
    { preHandler: requireAuth },
    async (request: any, reply) => {
      if (!reporting)
        return reply.code(503).send({ error: "SALES_STORE_UNAVAILABLE" });
      managerOnly(request);
      const parsed = z
        .object({ start: z.string().datetime(), end: z.string().datetime() })
        .refine((x) => new Date(x.end) > new Date(x.start), {
          message: "Invalid reporting period.",
        })
        .safeParse(request.query);
      if (!parsed.success)
        throw Object.assign(new Error("Invalid reporting period."), {
          statusCode: 422,
        });
      return reporting.report(
        actor(request),
        parsed.data.start,
        parsed.data.end,
      );
    },
  );
  return app;
};
