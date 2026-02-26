# Step 23: Core Unit Tests for SaleService

## Overview

18 unit tests for `SaleService` covering financial math, stock management, audit logging, and edge cases.

## Date

2026-02-24

## Summary

- Single item sales (with/without discounts, fractional quantities)
- Multi-item totals aggregation
- Stock deduction and insufficient stock errors
- Audit logging verification (fires on success, NOT on failure)
- Edge cases (zero discount, exact stock match)
- Uses Mockito + AssertJ, no database needed

## File Created

- `backend/src/test/java/com/lumora/pos/sales/service/SaleServiceTest.java`

## Next Step

Phase 3, Step 8: Refactor TerminalPage.tsx.
