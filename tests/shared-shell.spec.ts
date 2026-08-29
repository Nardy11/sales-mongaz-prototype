import { expect, test } from "@playwright/test";

const identities = {
  "rep@test.local": { id: "rep-shell", displayName: "TEST Representative", role: "sales_representative" },
  "tele@test.local": { id: "tele-shell", displayName: "TEST Telesales", role: "telesales_employee" },
  "sup@test.local": { id: "sup-shell", displayName: "TEST Supervisor", role: "telesales_supervisor" },
  "manager@test.local": { id: "manager-shell", displayName: "TEST Manager", role: "sales_manager" },
} as const;

async function shellFixture(page: any) {
  let current: (typeof identities)[keyof typeof identities] | null = null;
  const paths: string[] = [];
  await page.route("**/api/**", async (route: any) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    paths.push(path);
    const send = (body: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: status === 204 ? "" : JSON.stringify(body) });
    if (path === "/api/auth/me") return current ? send({ employee: current, csrfToken: "csrf" }) : send({}, 401);
    if (path === "/api/auth/login") {
      current = identities[request.postDataJSON().email as keyof typeof identities];
      return current ? send({ employee: current, csrfToken: "csrf" }) : send({ message: "Unknown test identity" }, 401);
    }
    if (path === "/api/auth/logout") { current = null; return send({}, 204); }
    if (path === "/api/profile" && current) return send({ ...current, email: Object.entries(identities).find(([, identity]) => identity.id === current!.id)?.[0], active: true, dateOfBirth: null, avatarDataUrl: null });
    if (path === "/api/customers") return send([{ id: "customer-shell", name: "TEST Scoped Customer", customerCode: "SHELL-1", classification: "gold", operationalStatus: "normal", isActive: true, openCommitments: 1 }]);
    if (path === "/api/customers/customer-shell") return send({ customer: { id: "customer-shell", name: "TEST Scoped Customer", customerCode: "SHELL-1", classification: "gold", operationalStatus: "normal", isActive: true, openCommitments: 1 }, commitments: [], orders: [], complaints: [] });
    if (path === "/api/representative/day") return send({ visits: [], commitments: [], close: { plannedVisits: 0, completedVisits: 0, customersVisited: 0, orders: 0, orderValue: 0, collections: 0, collectedAmount: 0, paymentPromises: 0, promiseAmount: 0, complaints: 0, opportunities: 0, observations: 0, reactivations: 0, openFollowUps: 0, carriedForward: 0 } });
    if (path === "/api/telesales/queue") return send([]);
    if (path === "/api/telesales/day") return send({ planned: 0, completed: 0, noAnswer: 0, escalations: 0, openWork: 0, tomorrowCarryover: 0 });
    if (path === "/api/telesales/activity") return send([{ id: "activity-shell", customerName: "TEST Scoped Customer", outcome: "no_answer", result: "followup", evidence: "TEST Telesales activity evidence", at: "2026-08-29T09:00:00Z" }]);
    if (path === "/api/supervisor/workspace") return send({ team: [], exceptions: [], checkpoints: [], quality: [], coaching: [] });
    if (path === "/api/manager/workspace") return send({ priorities: [], exceptions: [] });
    return send({}, 404);
  });
  await page.goto("/login");
  return { paths };
}

async function loginAs(page: any, email: keyof typeof identities) {
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور").fill("password");
  await page.getByRole("button", { name: "تسجيل الدخول" }).click();
}

test("authenticated role identity and profile cache stay isolated across logout and relogin", async ({ page }) => {
  await shellFixture(page);
  await loginAs(page, "sup@test.local");
  await expect(page.getByLabel("الدور المعروض: مشرف مبيعات هاتفية")).toBeVisible();
  await page.getByRole("button", { name: "فتح الملف الشخصي" }).click();
  await expect(page.getByText("TEST Supervisor")).toBeVisible();
  await page.getByRole("button", { name: "تسجيل الخروج" }).click();
  await loginAs(page, "rep@test.local");
  await expect(page.getByLabel("الدور المعروض: مندوب مبيعات")).toBeVisible();
  await page.getByRole("button", { name: "فتح الملف الشخصي" }).click();
  await expect(page.getByText("TEST Representative")).toBeVisible();
  await expect(page.getByText("TEST Supervisor")).toHaveCount(0);
});

test("header search, notifications, status guide, and brand profile entry are functional", async ({ page }) => {
  await shellFixture(page);
  await loginAs(page, "rep@test.local");
  await page.getByRole("button", { name: "بحث العملاء" }).click();
  await page.getByLabel("اسم العميل أو الكود").fill("TEST");
  await expect(page.getByText("TEST Scoped Customer")).toBeVisible();
  await page.getByRole("button", { name: "إغلاق" }).click();
  await page.getByRole("button", { name: "الإشعارات" }).click();
  await expect(page.getByText("لا توجد إشعارات جديدة")).toBeVisible();
  await page.getByRole("button", { name: "إغلاق" }).click();
  await page.getByRole("button", { name: "دليل حالات الواجهة" }).click();
  await expect(page.getByRole("dialog", { name: "دليل حالات الواجهة" })).toBeVisible();
  await page.getByRole("button", { name: "إغلاق الدليل" }).click();
  await page.getByRole("button", { name: "فتح الملف الشخصي" }).click();
  await expect(page.getByRole("button", { name: "تغيير الصورة الشخصية" })).toBeVisible();
});

test("rapid Telesales navigation has one authoritative tab state and never loads Representative APIs", async ({ page }) => {
  const control = await shellFixture(page);
  await loginAs(page, "tele@test.local");
  for (const name of ["عملي", "اليوم", "العملاء", "النشاط", "عملي", "النشاط"]) await page.getByRole("button", { name, exact: true }).click();
  await expect(page.getByRole("button", { name: "النشاط", exact: true })).toHaveAttribute("aria-current", "page");
  await page.locator('.activity-calendar__day[aria-label*="1 أدلة محفوظة"]').click();
  await expect(page.locator(".activity-calendar__details")).toContainText("TEST Telesales activity evidence");
  expect(control.paths.some((path) => path.includes("/representative") || path.includes("/visits"))).toBeFalsy();
  expect(await page.locator(".telesales-tabs").count()).toBe(0);
});
