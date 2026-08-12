# Code Map — Calendar

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/calendar/`

## Frontend
- `apps/web/src/app/(dashboard)/calendar/`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared spine & contracts (this repo — refine 2026-08-12)

- **Own code (frozen prod snapshot):** `code/apps/…` — calendar.module.js calendar.routes.js feed.routes.js 
- **Own/feature tables:** `client_attendance_sessions`, `client_calendar_feed_tokens`, `client_em_events`, `client_events`, `client_exams`, `client_fee_assignments`, `client_fee_installments`, `client_fee_payments`, `client_fee_structures`
- **Spine tables read (Core — cannot be cut):** `client_organizations`, `client_students`, `client_users`
- **Cross-module code imports:** none
- **Coupling read:** self-contained except the shared identity spine → **relatively separable** (standalone-ready).

See `_shared/CORE.md` for the spine; `_shared/domains/*/CONTRACTS.md` for shared domains.
