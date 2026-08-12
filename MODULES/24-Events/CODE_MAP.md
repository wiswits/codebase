# Code Map — Events

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/events/`

## Frontend
- `apps/web/src/app/(dashboard)/events/`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared spine & contracts (this repo — refine 2026-08-12)

- **Own code (frozen prod snapshot):** `code/apps/…` — events.module.js events.routes.js 
- **Own/feature tables:** `client_em_event_audience`, `client_em_event_reminders`, `client_em_event_resource_bookings`, `client_em_event_resources`, `client_em_event_rsvps`, `client_em_events`, `client_student_groups`
- **Spine tables read (Core — cannot be cut):** `client_classes`, `client_enrollments`, `client_parent_students`, `client_parents`, `client_roles`, `client_sections`, `client_students`, `client_user_roles`, `client_users`
- **Cross-module code imports:** ../core/event.service ../shared/event.queries 
- **Coupling read:** hard `require` into another domain → **coupled**, not cleanly separable.

See `_shared/CORE.md` for the spine; `_shared/domains/*/CONTRACTS.md` for shared domains.
