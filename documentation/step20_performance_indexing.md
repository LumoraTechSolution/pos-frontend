# Step 20: Performance Indexing for Reporting

## Overview

Added Flyway migration `V11` with 4 composite indices on `sales` and `sale_items` tables to optimize reporting queries.

## Date

2026-02-24

## Summary

| Index                       | Columns                        | Purpose                            |
| :-------------------------- | :----------------------------- | :--------------------------------- |
| `idx_sales_tenant_created`  | `(tenant_id, created_at DESC)` | Date-range reports (daily summary) |
| `idx_sales_tenant_payment`  | `(tenant_id, payment_method)`  | Payment breakdown                  |
| `idx_sales_tenant_customer` | `(tenant_id, customer_id)`     | Customer purchase history          |
| `idx_sale_items_product`    | `(tenant_id, product_id)`      | Top-selling products               |

## File Created

- `backend/src/main/resources/db/migration/V11__reporting_performance_indices.sql`

## Next Step

Phase 2, Step 5: Fix N+1 query in SaleService.
