import { expect, test } from "@playwright/test";

test("Phase 0 app boots with an RTL login route and protected role boundary", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "تسجيل الدخول" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.goto("/app/manager");
  await expect(page).toHaveURL(/\/login$/);
});
