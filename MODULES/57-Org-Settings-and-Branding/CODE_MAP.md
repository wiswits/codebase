# Code Map — Org Settings and Branding

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/settings/`
- `apps/backend/src/modules/org/`
- `apps/backend/src/modules/branding/`
- `apps/backend/src/modules/blueprints/`

## Frontend
- `apps/web/src/app/(dashboard)/admin/settings/ (+ branding sub-page, no nav entry yet)`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)
