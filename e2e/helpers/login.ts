import type { Page } from "@playwright/test";
import { TEST_USER } from "../fixtures/test-credentials";

/**
 * Logs in via the staff form on /login. Assumes the test tenant + user already
 * exist (seeded). Lands on /terminal for cashier-only roles, /overview otherwise.
 */
export async function loginAsCashier(page: Page) {
  await page.goto("/login");

  // Workspace slug is pre-filled with "DEMO"; clear and retype to be explicit.
  const slug = page.getByLabel(/workspace slug/i);
  await slug.fill(TEST_USER.domain);

  await page.getByLabel(/email/i).fill(TEST_USER.email);
  await page.getByLabel(/password/i).fill(TEST_USER.password);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Either /terminal (cashier) or /overview (any role with manager/admin/inv-manager).
  await page.waitForURL(/\/(terminal|overview)/);
}
