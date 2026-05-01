import { test, expect } from "@playwright/test";
import { loginAsCashier } from "./helpers/login";

/**
 * Lumora's most delicate flow: open drawer → ring up cash sale → close drawer
 * with matching variance. If this is silently broken, an honest cashier looks
 * dishonest. This test is the safety net.
 *
 * Setup expectations (see e2e/README.md):
 *   - Backend reachable at PLAYWRIGHT_API_URL (default http://localhost:8081)
 *   - Frontend reachable at PLAYWRIGHT_BASE_URL (default http://localhost:3000)
 *   - A test cashier exists for the configured tenant (E2E_DOMAIN/E2E_EMAIL/E2E_PASSWORD)
 *   - The cashier has NO open cash session at start (otherwise StartShiftModal
 *     won't appear; close any leftover session first)
 *   - At least one in-stock product is on the terminal grid for the cashier's branch
 *
 * Numeric assumption: E2E_PRODUCT_PRICE matches the price of the first product
 * the cashier sees in the grid. Default is 50.00 (matches the seed sample).
 */
const OPEN_BAL = 200;
const PRODUCT_PRICE = Number(process.env.E2E_PRODUCT_PRICE ?? 50);
// Counted closing balance = opening + cash sale (assumes 0% tax rate on test
// product — keep the tax rate as default 0 in seed for predictable variance).
const CLOSE_BAL = OPEN_BAL + PRODUCT_PRICE;

test.describe("cash session — open / sell / close", () => {
  test("variance is $0 when counted matches expected", async ({ page }) => {
    await loginAsCashier(page);
    await page.waitForURL(/\/terminal/);

    // ── 1. Open shift ────────────────────────────────────────────────────
    const startModal = page.getByRole("dialog", { name: /start your shift/i });
    await expect(startModal).toBeVisible();

    await startModal.getByLabel(/opening cash/i).fill(String(OPEN_BAL));
    await startModal.getByRole("button", { name: /start shift/i }).click();
    await expect(startModal).toBeHidden();

    // ── 2. Ring up the first product ─────────────────────────────────────
    // The terminal renders products as clickable cards. We grab the first
    // visible one — see test setup notes above.
    const productCard = page.locator("[data-product-card]").first();
    if ((await productCard.count()) === 0) {
      // Fallback: any button inside the product grid area.
      await page.locator("main button").filter({ hasText: /\$/ }).first().click();
    } else {
      await productCard.click();
    }

    // ── 3. CASH, exact tender, complete sale ────────────────────────────
    // The CASH method is the default; explicitly clicking it is idempotent
    // and protects the test if defaults change.
    await page.getByRole("button", { name: /^cash$/i }).first().click();
    await page.getByPlaceholder(PRODUCT_PRICE.toFixed(2)).fill(String(PRODUCT_PRICE));

    await page.getByRole("button", { name: /complete sale/i }).click();

    // Confirmation surfaces as a sonner toast.
    await expect(page.getByText(/sale (recorded|completed|complete)/i)).toBeVisible();

    // ── 4. End shift, assert variance = $0 ──────────────────────────────
    // Hotkey or menu-driven; both routes call setEndShiftOpen(true).
    // We trigger via the cashier menu / shift control. Adjust the selector if
    // the surface changes.
    const endShiftBtn = page.getByRole("button", { name: /end shift|close shift/i });
    await endShiftBtn.first().click();

    const endModal = page.getByRole("dialog", { name: /end shift/i });
    await expect(endModal).toBeVisible();

    // Sanity-check the expected total before submitting.
    await expect(endModal.getByText(`$${CLOSE_BAL.toFixed(2)}`)).toBeVisible();

    await endModal.getByLabel(/counted cash/i).fill(String(CLOSE_BAL));
    await expect(endModal.getByText(/balances exactly/i)).toBeVisible();

    await endModal.getByRole("button", { name: /end shift/i }).click();

    // The mutation success path raises a "drawer balanced" toast.
    await expect(page.getByText(/drawer balanced/i)).toBeVisible();
  });
});
