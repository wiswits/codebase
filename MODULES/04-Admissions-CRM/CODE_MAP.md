# Code Map — Admissions CRM

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/crm/`
- `apps/backend/src/modules/leads/`
- `apps/backend/src/modules/admissions/ (number series)`

## Frontend
- `apps/web/src/app/(dashboard)/crm/`
- `navConfig: Admissions`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)
