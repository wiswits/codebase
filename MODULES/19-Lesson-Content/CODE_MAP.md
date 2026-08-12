# Code Map — Lesson Content

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/content/`
- `apps/backend/src/modules/cms/`

## Frontend
- `apps/web/src/app/(dashboard)/content/`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared spine & contracts (this repo — refine 2026-08-12)

- **Own code (frozen prod snapshot):** `code/apps/…` — assets.routes.js assignments.routes.js cms.module.js content.module.js content.routes.js media.routes.js taxonomy.routes.js 
- **Own/feature tables:** `client_cms_assets`, `client_cms_assignments`, `client_cms_chapters`, `client_cms_classes`, `client_cms_media`, `client_cms_review_log`, `client_cms_subjects`, `client_cms_topics`, `client_cms_types`, `client_cms_versions`, `client_content_items`, `client_content_progress`, `client_hr_employees`, `client_subjects`
- **Spine tables read (Core — cannot be cut):** `client_classes`, `client_enrollments`, `client_parent_students`, `client_parents`, `client_sections`, `client_students`, `client_users`
- **Cross-module code imports:** none
- **Coupling read:** self-contained except the shared identity spine → **relatively separable** (standalone-ready).

See `_shared/CORE.md` for the spine; `_shared/domains/*/CONTRACTS.md` for shared domains.
