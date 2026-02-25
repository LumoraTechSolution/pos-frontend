# Step 19: Deletion Guards for Categories & Brands

## Overview

Added server-side deletion guards to prevent deleting Categories or Brands that have linked products. Raw DB constraint errors are now replaced with clean, actionable business exception messages.

## Date

2026-02-24

## Summary

- `CategoryService.deleteCategory()` now checks product count before deleting
- `BrandService.deleteBrand()` now checks product count before deleting
- Clean error: `"Cannot delete category 'X': 12 product(s) are still linked to it."`
- Added `countByCategoryIdAndTenantId()` and `countByBrandIdAndTenantId()` to `ProductRepository`

## Files Modified

- `backend/src/main/java/com/lumora/pos/inventory/repository/ProductRepository.java`
- `backend/src/main/java/com/lumora/pos/inventory/service/CategoryService.java`
- `backend/src/main/java/com/lumora/pos/inventory/service/BrandService.java`

## Next Step

Phase 2, Step 4: Add composite database index on `sales` table for reporting performance.
