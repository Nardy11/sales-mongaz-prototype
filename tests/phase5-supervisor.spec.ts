import { expect, test } from "@playwright/test";

const workspace = { team: [{ id: "tel-1", displayName: "TEST Telesales", queuedCalls: 3, completedCalls: 8 }], checkpoints: [{ checkpoint: "morning", evidence: "TEST morning readiness evidence", readinessState: "attention", at: "2026-08-22T08:00:00Z" }, { checkpoint: "midday", evidence: "TEST midday evidence", readinessState: "risk", at: "2026-08-22T12:00:00Z" }, { checkpoint: "end_of_day", evidence: "TEST end day evidence", readinessState: "attention", at: "2026-08-22T16:00:00Z" }], exceptions: [{ id: "x-open", kind: "overdue", severity: "urgent", summary: "TEST open exception", evidence: "TEST source evidence", requiredNextAction: "TEST required follow-up", status: "open", version: 1, sourceType: "telesales_call", sourceId: "call-1", employeeName: "TEST Telesales", customerName: "TEST Customer", operationallyOpen: true }, { id: "x-actioned", kind: "quality", severity: "watch", summary: "TEST actioned exception", evidence: "TEST actioned source", requiredNextAction: "TEST coaching", status: "actioned", version: 2, sourceType: "telesales_call", sourceId: "call-1", employeeName: "TEST Telesales", priorAction: "escalate", operationallyOpen: true }, { id: "x-resolved", kind: "resolved", severity: "normal", summary: "TEST resolved exception", evidence: "TEST resolved evidence", requiredNextAction: "None", status: "resolved", version: 3, sourceType: "telesales_call", sourceId: "call-1", employeeName: "TEST Telesales", operationallyOpen: false }], quality: [{ id: "q1", employeeName: "TEST Telesales", evidence: "TEST review evidence", result: "needs_improvement", observation: "TEST observation" }], coaching: [{ id: "c1", employeeName: "TEST Telesales", topic: "TEST coaching", evidence: "proof", agreedAction: "TEST agreed action", dueAt: "2026-08-23T09:00:00Z", status: "open" }] };
type FixtureResponse = { body: unknown; status?: number; delay?: number };

async function fixture(page: any, options: { responses?: FixtureResponse[]; actionBody?: unknown } = {}) {
  let logged = false;
  let workspaceRequests = 0;
  const responses = options.responses ?? [{ body: workspace }];
  await page.route("**/api/**", async (route: any) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    const send = (body: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (path === "/api/auth/me") return logged ? send({ employee: { id: "sup", displayName: "TEST Supervisor", role: "telesales_supervisor" }, csrfToken: "csrf" }) : send({}, 401);
    if (path === "/api/auth/login") { logged = true; return send({ employee: { id: "sup", displayName: "TEST Supervisor", role: "telesales_supervisor" }, csrfToken: "csrf" }); }
    if (path === "/api/supervisor/workspace") {
      const response = responses[Math.min(workspaceRequests++, responses.length - 1)];
      if (response.delay) await new Promise(resolve => setTimeout(resolve, response.delay));
      return send(response.body, response.status ?? 200);
    }
    if (method === "POST" && path.startsWith("/api/supervisor/")) return send(options.actionBody ?? { id: "saved", operationallyOpen: true });
    return send({}, 404);
  });
  await page.goto("/login");
  await page.locator("input").nth(1).fill("Phase0-password!");
  await page.locator("form button").click();
  await expect(page).toHaveURL(/supervisor/);
  return { workspaceRequests: () => workspaceRequests };
}

test("Supervisor route renders Arabic RTL checkpoints and evidence queue", async ({ page }) => { await fixture(page); await expect(page.locator("html")).toHaveAttribute("dir", "rtl"); await expect(page.getByText("TEST morning readiness evidence")).toBeVisible(); await expect(page.getByRole("button", { name: /TEST open exception/ })).toBeVisible(); await expect(page.getByText("TEST source evidence")).toBeVisible(); });
test("actioned work remains open while resolved exception is distinct", async ({ page }) => { await fixture(page); await expect(page.getByRole("button", { name: /TEST actioned exception/ })).toBeVisible(); await expect(page.getByRole("button", { name: /TEST resolved exception/ })).toBeVisible(); await page.getByRole("button", { name: /TEST actioned exception/ }).click(); await expect(page.getByText("العمل ما زال مفتوحاً")).toBeVisible(); });
test("Supervisor action validates evidence and refreshes feedback", async ({ page }) => { await fixture(page); await page.getByRole("button", { name: /TEST open exception/ }).click(); await page.getByRole("button", { name: "تصعيد" }).click(); await expect(page.getByText("يلزم تسجيل دليل الإجراء.")).toBeVisible(); await page.locator("textarea").fill("TEST supervisory intervention evidence"); await page.getByRole("button", { name: "إنشاء متابعة" }).click(); await expect(page.getByText("تم حفظ الدليل التشغيلي وتحديث العرض.")).toBeVisible(); });
test("Supervisor route retries a deliberate error and renders the recovered workspace", async ({ page }) => { const failed = { body: { message: "TEST retryable error" }, status: 500 }; const control = await fixture(page, { responses: [failed, failed, failed, failed, { body: workspace }] }); await expect(page.locator(".ds-state--error")).toBeVisible({ timeout: 15_000 }); await page.getByRole("button", { name: "إعادة المحاولة" }).click(); await expect(page.getByText("TEST morning readiness evidence")).toBeVisible(); await expect.poll(control.workspaceRequests).toBe(5); });
test("quality review renders employee, source evidence, result and observation without resolving source work", async ({ page }) => { await fixture(page); await expect(page.getByText("TEST review evidence")).toBeVisible(); await expect(page.getByText("TEST observation")).toBeVisible(); await expect(page.getByRole("button", { name: /TEST open exception/ })).toBeVisible(); await expect(page.getByText("مفتوح تشغيلياً")).toBeVisible(); });
test("coaching renders employee, topic, evidence, agreed action and due state without resolving source work", async ({ page }) => { await fixture(page); const coaching = page.locator(".ds-rail__item").filter({ hasText: "TEST coaching" }); await expect(coaching).toContainText("TEST Telesales"); await expect(coaching).toContainText("proof"); await expect(coaching).toContainText("TEST agreed action"); await expect(coaching).toContainText("مفتوح"); await expect(coaching.locator("time")).not.toHaveText("بدون موعد"); await expect(page.getByRole("button", { name: /TEST open exception/ })).toBeVisible(); await expect(page.getByText("مفتوح تشغيلياً")).toBeVisible(); });
test("Supervisor workspace remains usable at the accepted narrow mobile viewport", async ({ page }) => { await page.setViewportSize({ width: 427, height: 952 }); await fixture(page); await expect(page.locator("html")).toHaveAttribute("dir", "rtl"); await expect(page.getByText("TEST morning readiness evidence")).toBeVisible(); await expect(page.getByRole("button", { name: /TEST open exception/ })).toBeVisible(); await expect(page.getByText("proof")).toBeVisible(); await expect(page.getByRole("button", { name: "إنشاء متابعة" })).toBeVisible(); await expect(page.getByRole("button", { name: /TEST actioned exception/ })).toBeVisible(); await expect(page.getByRole("button", { name: /TEST resolved exception/ })).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy(); });
test("Supervisor workspace shows loading without fabricated evidence, then renders persisted data", async ({ page }) => { await fixture(page, { responses: [{ body: workspace, delay: 700 }] }); await expect(page.locator(".ds-state--loading")).toBeVisible(); await expect(page.getByText("TEST source evidence")).not.toBeVisible(); await expect(page.getByText("TEST source evidence")).toBeVisible(); await expect(page.locator(".ds-state--loading")).toHaveCount(0); });
test("Supervisor workspace renders an authenticated empty operational state without fabricated work", async ({ page }) => { await fixture(page, { responses: [{ body: { team: [], checkpoints: [], exceptions: [], quality: [], coaching: [] } }] }); await expect(page.getByText("لا توجد استثناءات")).toBeVisible(); await expect(page.getByText("لا يوجد عمل فريق يحتاج تدخلاً.")).toBeVisible(); await expect(page.getByText("TEST open exception")).toHaveCount(0); await expect(page.getByText("TEST morning readiness evidence")).toHaveCount(0); });
test("Supervisor follow-up refetch must show the persisted canonical consequence while source work remains open", async ({ page }) => {
  const after = { ...workspace, exceptions: [{ ...workspace.exceptions[0], status: "actioned", version: 2, priorAction: "follow_up", priorActionEvidence: "TEST persisted intervention evidence", actionActorName: "TEST Supervisor", followUpAt: "2026-08-23T09:00:00Z", resultingCommitment: { id: "commitment-1" }, operationallyOpen: true }], quality: [], coaching: [] };
  const control = await fixture(page, { responses: [{ body: workspace }, { body: after }], actionBody: { id: "saved", commitmentId: "commitment-1", operationallyOpen: true } });
  await page.getByRole("button", { name: /TEST open exception/ }).click();
  await expect(page.getByText("TEST persisted intervention evidence")).toHaveCount(0);
  await expect(page.getByText("التزام متابعة ناتج محفوظ")).toHaveCount(0);
  await page.locator("textarea").fill("TEST persisted intervention evidence");
  await page.getByRole("button", { name: "إنشاء متابعة" }).click();
  await expect.poll(control.workspaceRequests).toBe(2);
  await expect(page.getByText("TEST persisted intervention evidence")).toBeVisible();
  await expect(page.getByText(/المسؤول: TEST Supervisor/)).toBeVisible();
  await expect(page.getByText("موعد المتابعة الناتجة")).toBeVisible();
  await expect(page.locator(".ds-rail__item").filter({ hasText: "التزام متابعة ناتج محفوظ" }).filter({ hasText: "commitment-1" })).toBeVisible();
  await expect(page.getByText("مفتوح تشغيلياً")).toBeVisible();
  await expect(page.getByText("محلول فعلياً")).toHaveCount(0);
});
