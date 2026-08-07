# Utilization Management Module — Jatin's Ownership

This package contains **only** the backend work assigned to Jatin under the
Utilization Management Engineering Contract:

- Controllers
- Services (business logic)
- Validators
- Routes
- Shared response/pagination utilities and domain types used by the above

It intentionally does **not** include:

- Repository / database query layer (owned by another developer)
- Database schema / migrations
- Frontend
- Any files belonging to Ankit, Sunidhi, Neha, or Khushboo

## Architecture (per Engineering Standard)

```
Routes → Controllers → Services → Repositories (external, not included)
```

- **Controllers** receive requests, run validation middleware, call a
  service method, and return the standardized API response. They contain
  no SQL and no business logic.
- **Services** contain all business rules, workflow orchestration,
  transaction boundaries (via `withTransaction`), and audit calls. They
  contain no SQL — all persistence goes through repository interfaces.
- **Validators** use `express-validator` and are wired into routes via the
  shared `validateRequest` middleware.
- **Routes** wire `authenticate()` → `requirePermission()` → validators →
  controller for every endpoint.

## External integration points assumed to already exist

These are referenced by import but are **not part of this deliverable**
(owned by other developers / existing shared infrastructure), per the
contract's instruction to "assume repository functions already exist":

| Import path | Expected export |
|---|---|
| `middleware/auth.middleware` | `authenticate()` |
| `middleware/permission.middleware` | `requirePermission(permission: string)` |
| `core/audit/audit.service` | `auditService.record(entry)` |
| `core/database/transaction` | `withTransaction(fn)` |
| `core/notifications/notification-dispatcher` | `notificationDispatcher.dispatch(event)` |
| `modules/utilization/repositories/*.repository` | CRUD + query methods per resource (see service files for exact method names expected) |

## Mounting the module

```ts
import utilizationModuleRouter from './modules/utilization/routes';

app.use('/api/v1/utilization', utilizationModuleRouter);
```

## Permission keys used

`dashboard:view`, `employee:view|create|update|delete`,
`allocation:view|create|update|delete`, `capacity:view|create|update|delete`,
`utilization:view|create|update|delete|assign|unassign`,
`analytics:view`, `report:view|create|delete`, `settings:view|update`.

All permission checks are enforced via the existing `requirePermission()`
middleware — no roles are hardcoded, per the Engineering Standard's
Authorization section.

## Tenant isolation

Every service method receives the authenticated `AuthenticatedUser` (from
`req.user`, populated by `authenticate()`) and scopes all repository calls
by `user.org_id`. No org identifier is ever accepted from the request body,
params, or query string.
