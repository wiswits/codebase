# Code Map — Transport

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/erp/transport.routes.js`

## Frontend
- `apps/web/src/app/(dashboard)/transport/`
- `/bus-driver (special-cased)`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared spine & contracts (this repo — refine 2026-08-12)

This module owns its **own** backend file (kept in place, already de-duplicated):

- **Own code:** `code/apps/backend/src/modules/erp/transport.routes.js`
- **Owns tables:** `client_transport_routes/stops/trips/vehicles/staff`, `client_student_transport`
- **Stands on the CORE spine:** `client_users · client_students · client_enrollments · client_sections · client_classes` — see `_shared/CORE.md`
- **Domain coupling map:** `_shared/domains/erp/CONTRACTS.md`

**Cross-module contracts:** assigns real students via enrolment; parent-visible.
