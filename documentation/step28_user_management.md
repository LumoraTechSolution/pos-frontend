# Step 28 — User Management Module

## Date: 2026-02-25

## Summary

Full-stack User Management feature allowing admins to create, edit, activate/deactivate, and view employees.

## Backend

### New Files

- `user/dto/UserManagementDtos.java` — DTOs (UserResponse, CreateUserRequest, UpdateUserRequest)
- `user/service/UserManagementService.java` — Business logic: list, create, update, toggle status (all tenant-scoped)
- `user/controller/UserManagementController.java` — REST endpoints

### Modified Files

- `auth/repository/UserRepository.java` — Added `findAllByTenantIdOrderByCreatedAtDesc`

### API Endpoints

| Method | Path                               | Role(s)        | Description             |
| ------ | ---------------------------------- | -------------- | ----------------------- |
| GET    | `/api/v1/users`                    | ADMIN, MANAGER | List all employees      |
| GET    | `/api/v1/users/{id}`               | ADMIN, MANAGER | Get single employee     |
| POST   | `/api/v1/users`                    | ADMIN          | Create new employee     |
| PUT    | `/api/v1/users/{id}`               | ADMIN          | Update employee profile |
| PATCH  | `/api/v1/users/{id}/toggle-status` | ADMIN          | Activate / Deactivate   |

### Design Decisions

- **No hard delete** — employees are soft-deleted via `active` toggle (preserves audit trail, financial history)
- Jackson boolean naming: `boolean isActive` → JSON `"active"` (Lombok getter strips `is` prefix)

## Frontend

### New Files

- `services/userManagementService.ts` — API client with typed interfaces
- `app/(dashboard)/employees/page.tsx` — Full management page

### Features

1. **KPI cards** — Total / Active / Inactive employee counts
2. **Searchable table** — Filter by name or email
3. **Avatar initials** — Gradient circle with first+last initials
4. **Color-coded role badges** — ADMIN (rose), MANAGER (violet), CASHIER (indigo), INVENTORY_MANAGER (amber)
5. **Create Employee modal** — First/last name, email, password, PIN, phone, role selector
6. **Edit Employee modal** — Update name, phone, roles (email read-only)
7. **Toggle status** — One-click activate/deactivate with visual feedback

### Bug Fix

- `active` vs `isActive` mismatch: Jackson strips `is` prefix from boolean fields; frontend was reading `isActive` but backend was sending `active`

## Also Fixed (Reports Page)

- **CSV Export** — Browser Blob API, no library needed
- **PDF Print** — `window.print()` with clean print stylesheet
- Added `date-fns` dependency
- Added `PageResponse` type alias in `common.ts`
- Fixed unused imports in reports page
