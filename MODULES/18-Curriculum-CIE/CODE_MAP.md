# Code Map — Curriculum CIE

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/cie/`
- `apps/backend/src/modules/curriculum/`

## Frontend
- `apps/web/src/app/(dashboard)/academics/curriculum/`
- `+ /setup (627-line page)`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared spine & contracts (this repo — refine 2026-08-12)

- **Own code (frozen prod snapshot):** `code/apps/…` — assignments.routes.js builder.routes.js cie.module.js cie.routes.js curriculum.module.js curriculum.routes.js learn.routes.js myCurriculum.routes.js school.routes.js 
- **Own/feature tables:** `client_assignments`, `client_cms_assets`, `client_cms_assignments`, `client_cms_types`, `client_content_progress`, `client_subjects`, `client_worksheet_assignments`
- **Spine tables read (Core — cannot be cut):** `client_classes`, `client_enrollments`, `client_organizations`, `client_parent_students`, `client_parents`, `client_sections`, `client_students`, `client_users`
- **Cross-module code imports:** none
- **Coupling read:** self-contained except the shared identity spine → **relatively separable** (standalone-ready).

See `_shared/CORE.md` for the spine; `_shared/domains/*/CONTRACTS.md` for shared domains.
