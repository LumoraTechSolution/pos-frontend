# Step 25: Server-Side Search, Filter & Sort

**Date:** 2026-02-24

## Overview

Added server-side search, filtering, and sorting to all inventory tables. Backend uses JPA Specifications for dynamic query building with multi-tenant isolation.

## Files Modified

| File                  | Change                                                                        |
| --------------------- | ----------------------------------------------------------------------------- |
| `inventoryService.ts` | Products now accept `ProductFilters`; Categories/Brands accept `search` param |
| `SortableHeader.tsx`  | New reusable sortable column header component                                 |
| `ProductTable.tsx`    | Added sortable column support via props                                       |
| `products/page.tsx`   | Full search + filter dropdowns + sort                                         |
| `categories/page.tsx` | Server-side search + client-side sort                                         |
| `brands/page.tsx`     | Server-side search + client-side sort                                         |

## Products Page Features

- Search by name/SKU (debounced, server-side)
- Filter by Category (dropdown with backend data)
- Filter by Brand (dropdown with backend data)
- Filter by Status (Active/Inactive)
- Sort by Name, Price, or Stock (server-side)
- Active filter tag chips with clear buttons
