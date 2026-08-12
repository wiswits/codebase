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

## Shared spine & contracts (this repo — refine 2026-08-12)

- **Own code (frozen prod snapshot):** `code/apps/…` — admissions.module.js admissions.routes.js crm.module.js crm.routes.js 
- **Own/feature tables:** `client_admission_documents`, `client_admission_number_series`, `client_lead_activities`, `client_lead_demos`, `client_lead_stages`, `client_leads`
- **Spine tables read (Core — cannot be cut):** `client_enrollments`, `client_roles`, `client_sections`, `client_students`, `client_user_roles`, `client_users`
- **Cross-module code imports:** ../admissions/core/series.queries 
- **Coupling read:** hard `require` into another domain → **coupled**, not cleanly separable.

See `_shared/CORE.md` for the spine; `_shared/domains/*/CONTRACTS.md` for shared domains.
