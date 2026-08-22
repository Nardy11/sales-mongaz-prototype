import { expect, test } from "@playwright/test";

const workspace = { exceptions: [], priorities: [] };
const base = (name = "TEST actual metric", evidenceIds = ["evidence-a"], target: unknown = null) => ({ definitionStatus: "TEST_DEMO", periodStart: "2026-08-22T00:00:00.000Z", periodEnd: "2026-08-23T00:00:00.000Z", metrics: [{ metricKey: "completed_visits", displayName: name, definitionStatus: "TEST_DEMO", value: evidenceIds.length, unit: "count", evidenceIds, source: "visits", timeBoundary: "[start, end)", target }] });

async function open(page: any, reports: Array<{ body: unknown; status?: number; delay?: number }>) {
  let logged = false; let read = 0; const requests: string[] = [];
  await page.route("**/api/**", async (route: any) => {
    const url = new URL(route.request().url()), path = url.pathname;
    const send = (body: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (path === "/api/auth/me") return logged ? send({ employee: { id: "manager", displayName: "TEST Manager", role: "sales_manager" }, csrfToken: "csrf" }) : send({}, 401);
    if (path === "/api/auth/login") { logged = true; return send({ employee: { id: "manager", displayName: "TEST Manager", role: "sales_manager" }, csrfToken: "csrf" }); }
    if (path === "/api/manager/workspace") return send(workspace);
    if (path === "/api/manager/reports") { requests.push(url.search); const response = reports[Math.min(read++, reports.length - 1)]; if (response.delay) await new Promise(resolve => setTimeout(resolve, response.delay)); return send(response.body, response.status ?? 200); }
    return send({}, 404);
  });
  await page.goto("/login"); await page.locator("input").nth(1).fill("Phase0-password!"); await page.locator("form button").click(); await expect(page).toHaveURL(/manager/);
  return { requests };
}

test("Manager reporting renders canonical evidence separately from TEST_DEMO target metadata and refetches its UTC period", async ({ page }) => {
  const target = { id: "target-a", definitionId: "definition-a", value: "12", unit: "count", periodStart: "2026-08-22T00:00:00.000Z", periodEnd: "2026-08-23T00:00:00.000Z", version: 1, definitionStatus: "TEST_DEMO" };
  const control = await open(page, [{ body: base("TEST actual metric", ["evidence-a"], target) }, { body: base("TEST refreshed metric", ["evidence-b"]) }]);
  await expect(page.getByText("TEST actual metric")).toBeVisible(); await expect(page.getByText(/evidence-a/)).toBeVisible(); await expect(page.getByText(/12 count/)).toBeVisible(); await expect(page.getByText("TEST_DEMO").first()).toBeVisible();
  await page.getByRole("button", { name: "الفترة السابقة" }).click(); await expect(page.getByText("TEST refreshed metric")).toBeVisible(); await expect(page.getByText(/evidence-b/)).toBeVisible(); expect(control.requests[0]).not.toBe(control.requests[1]);
});

test("Manager reporting has real loading, retryable error, no-target and zero-evidence states in RTL mobile", async ({ page }) => {
  await page.setViewportSize({ width: 427, height: 952 });
  await open(page, [{ body: base("TEST delayed", [], null), delay: 300 }, { body: { message: "TEST reporting error" }, status: 500 }, { body: { message: "TEST reporting error" }, status: 500 }, { body: { message: "TEST reporting error" }, status: 500 }, { body: { message: "TEST reporting error" }, status: 500 }, { body: base("TEST zero evidence", [], null) }]);
  await expect(page.locator(".ds-state--loading").last()).toBeVisible(); await expect(page.getByText("TEST delayed")).toBeVisible(); await expect(page.getByText(/لا يوجد هدف TEST_DEMO/)).toBeVisible(); await expect(page.getByText(/لا توجد أدلة/)).toBeVisible();
  await page.getByRole("button", { name: "الفترة التالية" }).click(); await expect(page.locator(".ds-state--error")).toBeVisible({ timeout: 15_000 }); await page.getByRole("button", { name: "إعادة المحاولة" }).click(); await expect(page.getByText("TEST zero evidence")).toBeVisible(); await expect(page.locator("html")).toHaveAttribute("dir", "rtl"); expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
});
