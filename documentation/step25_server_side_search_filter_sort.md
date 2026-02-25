# Step 25: Server-Side Search, Filter & Sort for Inventory Tables

**Date:** 2026-02-24
**Scope:** Backend + Frontend

## Summary

Enhanced all three inventory tables (Products, Categories, Brands) with server-side search and filtering capabilities. Product table also supports server-side sorting and multi-dimensional filtering (by category, brand, and status).

## Backend Changes

### 1. ProductRepository — JpaSpecificationExecutor

- Added `JpaSpecificationExecutor<ProductEntity>` to support dynamic query building
- File: `backend/src/main/java/com/lumora/pos/inventory/repository/ProductRepository.java`

### 2. ProductSpecification — Dynamic Query Builder (NEW)

- Created Spring Data JPA Specification class
- Dynamically builds WHERE clauses based on optional parameters:
  - `tenantId` (always enforced for multi-tenant isolation)
  - `search` (ILIKE match on product name OR SKU)
  - `categoryId` (exact match filter)
  - `brandId` (exact match filter)
  - `isActive` (boolean filter)
- File: `backend/src/main/java/com/lumora/pos/inventory/repository/ProductSpecification.java`

### 3. ProductController — Query Parameters

- GET `/api/v1/products` now accepts:
  - `?search=widget` — search by name/SKU
  - `?categoryId=xxx` — filter by category
  - `?brandId=xxx` — filter by brand
  - `?isActive=true` — filter by status
  - `?sort=basePrice,desc` — sort by price descending
  - `?page=0&size=20` — pagination (existing)
- File: `backend/src/main/java/com/lumora/pos/inventory/controller/ProductController.java`

### 4. ProductService — Specification-Based Queries

- `getAllProducts()` now uses `ProductSpecification.withFilters()` instead of simple `findAllByTenantId()`
- File: `backend/src/main/java/com/lumora/pos/inventory/service/ProductService.java`

### 5. CategoryRepository & BrandRepository — Search Method

- Added `searchByName()` JPQL query with `ILIKE` matching
- Files:
  - `backend/src/main/java/com/lumora/pos/inventory/repository/CategoryRepository.java`
  - `backend/src/main/java/com/lumora/pos/inventory/repository/BrandRepository.java`

### 6. CategoryService & BrandService — Search Support

- `getAllCategories(search)` and `getAllBrands(search)` now route to search method when search param is provided
- Files:
  - `backend/src/main/java/com/lumora/pos/inventory/service/CategoryService.java`
  - `backend/src/main/java/com/lumora/pos/inventory/service/BrandService.java`

### 7. CategoryController & BrandController — Search Parameter

- GET `/api/v1/categories?search=food` and GET `/api/v1/brands?search=apple` now supported
- Files:
  - `backend/src/main/java/com/lumora/pos/inventory/controller/CategoryController.java`
  - `backend/src/main/java/com/lumora/pos/inventory/controller/BrandController.java`

## Frontend Changes

### 1. inventoryService — API Integration

- `getProducts()` now accepts `ProductFilters` object with search, categoryId, brandId, isActive, sort
- `getCategories()` and `getBrands()` now accept optional `search` parameter
- All filters are serialized as URL query parameters
- File: `frontend/src/services/inventoryService.ts`

### 2. SortableHeader Component (NEW)

- Reusable clickable column header component
- Click cycles: asc → desc → reset
- Visual indicators: ▲ (asc), ▼ (desc), ⇅ (hover hint when inactive)
- Active sort shown in indigo color
- File: `frontend/src/components/ui/SortableHeader.tsx`

### 3. Products Page — Full Filter UI

- Search bar with 300ms debounce
- Filter dropdowns: Category, Brand, Status
- Sortable columns: Product Name, Price, Stock (server-side)
- Active filter tags with individual clear buttons
- Global "Clear" button when any filter is active
- File: `frontend/src/app/(dashboard)/inventory/products/page.tsx`

### 4. Categories Page — Search & Sort

- Search bar with server-side search
- Sortable columns: Name, Slug, Description, Parent (client-side)
- Result count indicator
- File: `frontend/src/app/(dashboard)/inventory/categories/page.tsx`

### 5. Brands Page — Search & Sort

- Search bar with server-side search
- Sortable columns: Name, Website, Description, Added Date (client-side)
- Result count indicator
- File: `frontend/src/app/(dashboard)/inventory/brands/page.tsx`

### 6. ProductTable Component — Enhanced

- Now accepts sortKey, sortDirection, onSort props
- Sortable column headers for Product, Price, Stock
- Improved visual design with consistent styling
- File: `frontend/src/components/inventory/ProductTable.tsx`

## Architecture Decision

- **Products**: Full server-side search, filter, AND sort (because products can number in thousands)
- **Categories/Brands**: Server-side search + client-side sort (these are typically small lists < 100 items, so sorting them client-side is fine and avoids adding pagination complexity)

## API Examples

```bash
# Products: Search + Filter + Sort
GET /api/v1/products?search=widget&categoryId=xxx&isActive=true&sort=basePrice,desc&page=0&size=20

# Categories: Search
GET /api/v1/categories?search=food

# Brands: Search
GET /api/v1/brands?search=apple
```
