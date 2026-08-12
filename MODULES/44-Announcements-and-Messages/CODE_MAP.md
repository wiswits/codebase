# Code Map — Announcements and Messages

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/communication/`

## Frontend
- `apps/web/src/app/(dashboard)/communication/`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared spine & contracts (this repo — refine 2026-08-12)

- **Own code (frozen prod snapshot):** `code/apps/…` — announcements.routes.js communication.module.js messages.routes.js 
- **Own/feature tables:** `client_assignments`, `client_message_threads`, `client_messages`, `client_notifications`, `client_subjects`, `client_teacher_subjects`, `client_timetable_slots`
- **Spine tables read (Core — cannot be cut):** `client_classes`, `client_enrollments`, `client_parent_students`, `client_parents`, `client_roles`, `client_sections`, `client_students`, `client_user_roles`, `client_users`
- **Cross-module code imports:** none
- **Coupling read:** self-contained except the shared identity spine → **relatively separable** (standalone-ready).

See `_shared/CORE.md` for the spine; `_shared/domains/*/CONTRACTS.md` for shared domains.
