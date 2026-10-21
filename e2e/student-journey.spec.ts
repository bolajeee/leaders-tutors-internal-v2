import { expect, test } from "@playwright/test";

test("public CTA opens signup", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("stronger education");
  await page.getByRole("link", { name: "Start learning" }).first().click();
  await expect(page).toHaveURL(/\/sign-up$/);
});

test("demo student can browse the curriculum and open a lesson", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Explore the local demo" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/tutorials");
  await page.getByRole("button", { name: /First Term/ }).click();
  await page.getByRole("button", { name: /Week 1/ }).click();
  await page.getByRole("link", { name: /Start lesson/ }).first().click();
  await expect(page.getByRole("heading", { name: /Living and non-living things/ })).toBeVisible();
});

test("transaction filters and receipt details work", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Explore the local demo" }).click();
  await page.goto("/transactions");
  await page.getByRole("combobox").selectOption("cancelled");
  await expect(page.getByText("TRANS-DEMO-1003")).toBeVisible();
  await page.getByRole("button", { name: "Details" }).click();
  await expect(page.getByRole("dialog")).toContainText("Subscription payment");
});
