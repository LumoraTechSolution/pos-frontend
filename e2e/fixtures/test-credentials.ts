/**
 * Credentials the E2E suite uses to log in. The backend's V1 / dev seed data
 * provisions these — adjust if your seed changes.
 *
 * For CI you should override these via env vars and use a dedicated test
 * tenant so accidental writes don't pollute shared dev data.
 */
export const TEST_USER = {
  domain: process.env.E2E_DOMAIN ?? "DEMO",
  email: process.env.E2E_EMAIL ?? "cashier@demo.lumora.com",
  password: process.env.E2E_PASSWORD ?? "Cashier123!",
};

export const API_URL =
  process.env.PLAYWRIGHT_API_URL ?? "http://localhost:8081";
