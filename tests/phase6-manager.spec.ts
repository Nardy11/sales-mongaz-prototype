import { expect, test } from "@playwright/test";

const initial = {
  exceptions: [{ id: "exception-1", summary: "TEST canonical Supervisor exception", evidence: "TEST canonical source evidence", severity: "urgent", status: "open", ownerName: "TEST owner", requiredNextAction: "TEST required action" }],
  priorities: [{ id: "priority-1", title: "TEST Manager priority", reason: "TEST reason", successCondition: "TEST success condition", evidence: "TEST priority evidence", dueAt: "2026-08-23T09:00:00Z", urgency: "urgent", status: "open", version: 1, ownerName: "TEST owner", operationallyOpen: true }]
};
const actioned = { ...initial, priorities: [{ ...initial.priorities[0], status: "actioned", version: 2, decisionKind: "decision", decisionEvidence: "TEST manager decision evidence", decisionActorName: "TEST Manager", followUpAt: "2026-08-24T09:00:00Z", resultingCommitment: { id: "commitment-manager-1" }, operationallyOpen: true }] };
const resolved = { ...initial, priorities: [{ ...initial.priorities[0], status: "resolved", version: 2, decisionKind: "resolve", decisionEvidence: "TEST completion evidence", decisionActorName: "TEST Manager", operationallyOpen: false }] };

async function fixture(page: any, responses: Array<{ body: unknown; status?: number; delay?: number }> = [{ body: initial }]) {
  let logged = false; let reads = 0;
  await page.route("**/api/**", async (route: any) => {
    const path = new URL(route.request().url()).pathname; const method = route.request().method();
    const send = (body: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (path === "/api/auth/me") return logged ? send({ employee: { id: "manager", displayName: "TEST Manager", role: "sales_manager" }, csrfToken: "csrf" }) : send({}, 401);
    if (path === "/api/auth/login") { logged = true; return send({ employee: { id: "manager", displayName: "TEST Manager", role: "sales_manager" }, csrfToken: "csrf" }); }
    if (path === "/api/manager/workspace") { const response = responses[Math.min(reads++, responses.length - 1)]; if (response.delay) await new Promise(resolve => setTimeout(resolve, response.delay)); return send(response.body, response.status ?? 200); }
    if (method === "POST" && path.includes("/api/manager/priorities/")) return send({ id: "priority-1", commitmentId: "commitment-manager-1", operationallyOpen: true, version: 2 });
    return send({}, 404);
  });
  await page.goto("/login"); await page.locator("input").nth(1).fill("Phase0-password!"); await page.locator("form button").click(); await expect(page).toHaveURL(/manager/);
  return { reads: () => reads };
}

test("Manager route is RTL and renders canonical exception evidence with priority success condition", async ({ page }) => {
  await fixture(page);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByText("TEST canonical Supervisor exception")).toBeVisible();
  await expect(page.getByText("TEST canonical source evidence")).toBeVisible();
  await expect(page.getByText("TEST success condition")).toBeVisible();
});

test("Manager decision requires evidence, refetches persisted consequence, and remains operationally open", async ({ page }) => {
  const control = await fixture(page, [{ body: initial }, { body: actioned }]);
  await page.getByRole("button", { name: /TEST Manager priority/ }).click();
  await page.getByRole("button", { name: /تسجيل قرار ومتابعة/ }).click();
  await expect(page.getByText("يلزم تسجيل دليل القرار.")).toBeVisible();
  await page.locator("textarea").fill("TEST manager decision evidence");
  await page.getByRole("button", { name: /تسجيل قرار ومتابعة/ }).click();
  await expect.poll(control.reads).toBe(2);
  await expect(page.getByText("TEST manager decision evidence")).toBeVisible();
  await expect(page.getByText(/commitment-manager-1/)).toBeVisible();
  await expect(page.getByText("مفتوح تشغيلياً")).toBeVisible();
});

test("explicit recorded completion is visually distinct from actioned work", async ({ page }) => {
  await fixture(page, [{ body: resolved }]);
  await expect(page.getByText("TEST completion evidence")).toBeVisible();
  await expect(page.getByText("مكتمل فعلياً")).toBeVisible();
  await expect(page.getByRole("button", { name: /تسجيل قرار ومتابعة/ })).toHaveCount(0);
});

test("Manager workspace has real loading, empty, retryable error, and narrow mobile states", async ({ page }) => {
  await page.setViewportSize({ width: 427, height: 952 });
  await fixture(page, [{ body: initial, delay: 500 }]);
  await expect(page.locator(".ds-state--loading")).toBeVisible();
  await expect(page.getByRole("button", { name: /TEST Manager priority/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
});

test("Manager workspace retries a server error without fabricated operational evidence", async ({ page }) => {
  const failed = { body: { message: "TEST retryable manager error" }, status: 500 };
  await fixture(page, [failed, failed, failed, failed, { body: initial }]);
  await expect(page.locator(".ds-state--error")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("TEST canonical source evidence")).toHaveCount(0);
  await page.getByRole("button", { name: "إعادة المحاولة" }).click();
  await expect(page.getByText("TEST canonical source evidence")).toBeVisible();
});

test("Manager workspace renders an empty state without fabricated priorities or exceptions", async ({ page }) => {
  await fixture(page, [{ body: { priorities: [], exceptions: [] } }]);
  await expect(page.getByText("لا توجد استثناءات")).toBeVisible();
  await expect(page.getByText("لا توجد أولويات", { exact: true })).toBeVisible();
  await expect(page.getByText("TEST Manager priority")).toHaveCount(0);
});
