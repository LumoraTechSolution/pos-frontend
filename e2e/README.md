# Lumora POS — E2E (Playwright)

Playwright tests live here. They drive a real browser against a running stack;
they do not stub the network.

## Running locally

```bash
# 1. From repo root — bring the stack up.
docker compose up -d database backend frontend

# 2. From frontend/ — install Playwright browsers (one-time).
npx playwright install --with-deps chromium

# 3. Run the suite.
npm run test:e2e

# Or with the UI runner (interactive, time-travel debugger).
npm run test:e2e:ui
```

## Required test data

The tests assume a tenant + cashier user are seeded. Defaults in
`fixtures/test-credentials.ts`:

| Variable        | Default                       |
|-----------------|-------------------------------|
| `E2E_DOMAIN`    | `DEMO`                        |
| `E2E_EMAIL`     | `cashier@demo.lumora.com`     |
| `E2E_PASSWORD`  | `Cashier123!`                 |
| `E2E_PRODUCT_PRICE` | `50` (price of the first visible product) |

Override any of them via env var when your seed is different:

```bash
E2E_EMAIL=test+cashier@example.com E2E_PASSWORD=…  npm run test:e2e
```

## Cash-session flow

`cash-session.spec.ts` is the canonical test that protects the
"open drawer → sell → close drawer" loop:

1. Log in as the cashier (lands on `/terminal`).
2. Open shift with $200.
3. Ring up the first product on the grid (tax-free).
4. Pay CASH, exact tender.
5. Close shift counted at $200 + product price.
6. Assert the success toast says "drawer balanced".

> **Heads-up:** the test expects the cashier to have **no open cash session**
> when it starts. In CI you can guarantee this by re-seeding the database
> before the run; locally, just close any leftover shift before re-running.
