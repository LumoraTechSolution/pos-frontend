# Step 21: Fix N+1 Query in SaleService

## Overview

Fixed the N+1 query problem in `SaleService.mapToResponse()` — product names are now batch-fetched in 1 query instead of N individual queries.

## Date

2026-02-24

## Summary

- A receipt with 10 items used to make 11 DB queries (1 sale + 10 products)
- Now it makes only 2 queries (1 sale + 1 batch product fetch)
- Uses `findAllById()` + in-memory Map lookup

## File Modified

- `backend/src/main/java/com/lumora/pos/sales/service/SaleService.java`

## Next Step

Phase 3, Step 6: Setup Testing Infrastructure.
