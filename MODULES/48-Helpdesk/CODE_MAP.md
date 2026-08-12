# Code Map — Helpdesk

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/helpdesk/`
- `apps/backend/src/modules/support/`

## Frontend
- `Reported Problems page + floating button`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared spine & contracts (this repo — refine 2026-08-12)

- **Own code (frozen prod snapshot):** `code/apps/…` — helpdesk.module.js helpdesk.routes.js support.module.js support.routes.js 
- **Own/feature tables:** `client_feature_flags`, `client_helpdesk_attachments`, `client_helpdesk_events`, `client_helpdesk_messages`, `client_helpdesk_tickets`
- **Spine tables read (Core — cannot be cut):** `client_organizations`, `client_roles`, `client_user_roles`, `client_users`
- **Cross-module code imports:** none
- **Coupling read:** self-contained except the shared identity spine → **relatively separable** (standalone-ready).

See `_shared/CORE.md` for the spine; `_shared/domains/*/CONTRACTS.md` for shared domains.
