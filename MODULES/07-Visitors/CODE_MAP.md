# Code Map — Visitors

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/visitors/`

## Frontend
- `apps/web/src/app/(dashboard)/visitors/`
- `navConfig: Visitors (soon:true)`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared spine & contracts (this repo — refine 2026-08-12)

- **Own code (frozen prod snapshot):** `code/apps/…` — visitors.module.js visitors.routes.js 
- **Own/feature tables:** `client_visitor_logs`, `client_visitor_passes`
- **Spine tables read (Core — cannot be cut):** none
- **Cross-module code imports:** ../core/visitor.queries ../pass/pass.queries 
- **Coupling read:** hard `require` into another domain → **coupled**, not cleanly separable.

See `_shared/CORE.md` for the spine; `_shared/domains/*/CONTRACTS.md` for shared domains.
