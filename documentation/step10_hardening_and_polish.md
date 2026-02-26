# Step 10: System Hardening & Frontend Polish

## Overview

Based on the audit, we are now implementing Optimistic Locking for data integrity, Role-Based Access Control (RBAC) at the controller level, and connecting the frontend CRUD actions.

## Planned Steps

### Part 1: System Hardening (Backend)

- [ ] **Step 1: Implement Optimistic Locking**
  - Add `@Version` field to `BaseEntity`.
  - Create Flyway migration to add `version` column to all tables.
- [x] **Step 2: Implement Method-Level Security (RBAC)**
  - Add `@PreAuthorize` to `ProductController`. ✅
  - Add `@PreAuthorize` to `CategoryController`. ✅
  - Add `@PreAuthorize` to `BrandController`. ✅

### Part 2: Frontend Polish

- [x] **Step 3: Connect Product Table Actions**
  - Update `ProductTable.tsx` to handle "Edit" and "Delete" clicks. ✅
  - Implement delete confirmation dialog (Browser confirm). ✅
  - Integrate with `inventoryService` and React Query. ✅

---

## Execution Progress

### Part 1, Step 1: Implement Optimistic Locking

- **Status**: ✅ COMPLETED
- **Tasks**:
  - Update `BaseEntity.java` with `@Version`.
  - Create `V8__add_version_for_optimistic_locking.sql` to update existing tables.
