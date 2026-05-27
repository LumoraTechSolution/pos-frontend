import type { Page } from "@playwright/test";
import { TEST_USER, TERMINAL_USER } from "../fixtures/test-credentials";

type Credentials = { domain: string; email: string; password: string };

/**
 * Fills and submits the staff email/password form on /login with the given
 * credentials. Resolves once we've navigated away from /login. Does NOT assert a
 * particular destination — the post-login route depends on the user's roles
 * (CASHIER-only → /terminal, everyone else → /overview).
 */
export async function login(page: Page, creds: Credentials) {
  await page.goto("/login");

  // Workspace slug is pre-filled with "DEMO"; clear and retype to be explicit.
  await page.getByLabel(/workspace slug/i).fill(creds.domain);
  await page.getByLabel(/^email$/i).fill(creds.email);
  await page.getByLabel(/^password$/i).fill(creds.password);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Leaving /login is the signal the login succeeded.
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/**
 * Logs in as the seeded cashier (env-overridable). Assumes the test tenant +
 * cashier user exist. Lands on /terminal for cashier-only roles, /overview
 * otherwise.
 */
export async function loginAsCashier(page: Page) {
  await login(page, TEST_USER);
  await page.waitForURL(/\/(terminal|overview)/);
}

/**
 * Logs in with a terminal-capable account and lands on /terminal. Uses an
 * account guaranteed to exist in the dev seed (ADMIN by default) and navigates
 * to /terminal explicitly, so it doesn't depend on a role-based redirect to a
 * dedicated cashier. Intended for specs that only need the terminal rendered
 * (a11y / visual), not the cashier-only cash-session flow.
 */
export async function loginAndOpenTerminal(page: Page) {
  await login(page, TERMINAL_USER);
  await page.goto("/terminal");
  await page.waitForURL(/\/terminal/);
}
