# Feature #1: Dashboard Analytics — Complete Documentation

**Date:** 2026-02-25  
**Phase:** Phase 1  
**Status:** ✅ Complete

---

## Overview

A real-time analytics dashboard providing business owners and managers with KPIs, sales trends, top products, payment breakdowns, stock alerts, and recent transaction history — all in a single page that auto-refreshes every 60 seconds.

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                  Frontend (Next.js)               │
│                                                    │
│  OverviewPage ──→ dashboardService.getDashboard() │
│       │                     │                      │
│       ▼                     ▼                      │
│  ┌─────────┐     GET /api/v1/dashboard             │
│  │ Recharts │              │                       │
│  │ Charts   │              │                       │
│  └─────────┘              │                       │
└────────────────────────────┼───────────────────────┘
                             │
┌────────────────────────────┼───────────────────────┐
│             Backend (Spring Boot)                   │
│                            ▼                        │
│  DashboardController ──→ DashboardService           │
│                              │                      │
│            ┌─────────────────┼──────────────┐       │
│            ▼                 ▼              ▼       │
│    SaleRepository    ProductRepository   TenantCtx  │
│    (5 queries)       (3 queries)                    │
│            │                 │                      │
│            ▼                 ▼                      │
│         ┌─────────────────────┐                     │
│         │    PostgreSQL DB     │                     │
│         │ (sales, sale_items,  │                     │
│         │  products tables)    │                     │
│         └─────────────────────┘                     │
└─────────────────────────────────────────────────────┘
```

---

## API Reference

### `GET /api/v1/dashboard`

**Authorization:** ADMIN, MANAGER  
**Response:** `ApiResponse<DashboardResponse>`

| Field                    | Type       | Description                                                                                                  |
| ------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `todaySales`             | BigDecimal | Total net revenue today                                                                                      |
| `yesterdaySales`         | BigDecimal | Total net revenue yesterday (for % change)                                                                   |
| `todayTransactions`      | int        | Number of sales today                                                                                        |
| `yesterdayTransactions`  | int        | Number of sales yesterday                                                                                    |
| `avgOrderValue`          | BigDecimal | Today's average order value                                                                                  |
| `yesterdayAvgOrderValue` | BigDecimal | Yesterday's average (for % change)                                                                           |
| `activeProducts`         | int        | Products with isActive = true                                                                                |
| `totalProducts`          | int        | All products                                                                                                 |
| `salesTrend[]`           | List       | 7-day daily {date, dayLabel, revenue, orders}                                                                |
| `topProducts[]`          | List       | Top 5 {productId, productName, quantitySold, revenue}                                                        |
| `paymentBreakdown[]`     | List       | Per-method {method, amount, count}                                                                           |
| `lowStockAlerts[]`       | List       | Up to 10 {productId, productName, sku, currentStock, threshold}                                              |
| `recentTransactions[]`   | List       | Last 10 {saleId, invoiceNumber, netAmount, paymentMethod, paymentStatus, customerName, createdAt, itemCount} |

---

## Backend Files

| File                       | Path                    | Purpose                                                       |
| -------------------------- | ----------------------- | ------------------------------------------------------------- |
| `DashboardResponse.java`   | `dashboard/dto/`        | Response DTO with 5 nested static classes                     |
| `DashboardService.java`    | `dashboard/service/`    | Aggregates all analytics data in single read-only transaction |
| `DashboardController.java` | `dashboard/controller/` | REST endpoint, ADMIN/MANAGER only                             |
| `SaleRepository.java`      | `sales/repository/`     | +5 JPQL aggregate queries                                     |
| `ProductRepository.java`   | `inventory/repository/` | +3 dashboard queries                                          |

### Repository Queries Added

**SaleRepository:**
| Method | SQL Concept | Purpose |
|--------|-------------|---------|
| `countByTenantIdAndDateRange` | `COUNT` | Transaction count |
| `sumNetAmountByTenantIdAndDateRange` | `SUM + COALESCE` | Revenue total |
| `findTopSellingProducts` | `GROUP BY + JOIN + ORDER BY` | Top sellers by qty |
| `findPaymentMethodBreakdown` | `GROUP BY` | Sales by payment type |
| `findRecentSales` | `LEFT JOIN FETCH` | Recent sales with eager loading |

**ProductRepository:**
| Method | SQL Concept | Purpose |
|--------|-------------|---------|
| `findLowStockProducts` | `WHERE stock <= threshold` | Low stock alerts |
| `countActiveByTenantId` | `COUNT + WHERE isActive` | Active products KPI |
| `countByTenantId` | Derived query | Total products KPI |

---

## Frontend Files

| File                  | Path                        | Purpose                                      |
| --------------------- | --------------------------- | -------------------------------------------- |
| `dashboard.ts`        | `types/`                    | TypeScript interfaces for dashboard data     |
| `dashboardService.ts` | `services/`                 | API client with single `getDashboard()` call |
| `page.tsx`            | `app/(dashboard)/overview/` | Full dashboard page with 6 sections          |

### Dashboard Sections

1. **KPI Cards** (4 cards) — Revenue, Transactions, Avg Order Value, Active Products
   - Each shows today's value + % change vs yesterday
   - Color-coded trend arrows (green ▲ / red ▼)
   - Gradient icon backgrounds

2. **Sales Trend Chart** — Recharts `AreaChart`
   - 7-day rolling window
   - Indigo gradient fill
   - Custom dark-theme tooltip
   - Responsive container

3. **Top Products** — Custom horizontal progress bars
   - Top 5 sellers (30-day window)
   - Ranked with color-coded bars
   - Shows quantity + revenue

4. **Payment Methods** — Recharts `PieChart` (donut)
   - Color-coded by method (CASH=green, CARD=indigo, ONLINE=amber)
   - Legend with icons and amounts
   - Custom tooltip

5. **Low Stock Alerts** — Urgency-coded cards
   - Red = out of stock (0)
   - Amber = critically low (≤50% of threshold)
   - Yellow = warning
   - Progress bar showing stock/threshold ratio

6. **Recent Transactions** — Full table
   - Invoice, Customer, Items, Payment, Status badge, Amount, Time
   - Color-coded status (PAID=green, PENDING=amber, CANCELLED=red)

### Technical Features

- **Auto-refresh:** Every 60 seconds via `refetchInterval`
- **Loading skeleton:** Pulse animation placeholders
- **Error state:** Friendly message with retry hint
- **Responsive:** 1→4 column grid

---

## Dependencies

| Library                 | Version  | Purpose                                     |
| ----------------------- | -------- | ------------------------------------------- |
| `recharts`              | Latest   | AreaChart, PieChart for data visualization  |
| `@tanstack/react-query` | Existing | Data fetching with caching and auto-refresh |
| `lucide-react`          | Existing | Icons for KPI cards and table               |

---

## Security

- Endpoint restricted to `ADMIN` and `MANAGER` roles via `@PreAuthorize`
- All queries scoped by `tenantId` for multi-tenant isolation
- No sensitive data exposed (no passwords, tokens, etc.)

---

## Performance Considerations

- Single API call fetches all dashboard data (reduces round-trips)
- `@Transactional(readOnly = true)` for query optimization
- `COALESCE(SUM(...), 0)` prevents null values in empty date ranges
- `LEFT JOIN FETCH` for recent transactions prevents N+1 queries
- Frontend caches with React Query (60s TTL matches refetch interval)
