# Code Map — Teaching Canvas

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/teaching/`

## Frontend
- `apps/web/src/app/(dashboard)/teacher/teaching/ (de-menued per WW-84)`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared spine & contracts (this repo — refine 2026-08-12)

- **Own code (frozen prod snapshot):** `code/apps/…` — teaching.module.js teaching.routes.js 
- **Own/feature tables:** `client_qb_chapters`, `client_qb_questions`, `client_qb_topics`, `client_section_teachers`, `client_simulations`, `client_slide_decks`, `client_slides`, `client_subjects`, `client_teachers`
- **Spine tables read (Core — cannot be cut):** `client_classes`, `client_enrollments`, `client_sections`, `client_students`, `client_users`
- **Cross-module code imports:** none
- **Coupling read:** self-contained except the shared identity spine → **relatively separable** (standalone-ready).

See `_shared/CORE.md` for the spine; `_shared/domains/*/CONTRACTS.md` for shared domains.
