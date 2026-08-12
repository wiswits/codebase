# Code Map — Public Forms

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/public-forms/`

## Frontend
- `Forms & Fields`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared spine & contracts (this repo — refine 2026-08-12)

- **Own code (frozen prod snapshot):** `code/apps/…` — publicForms.admin.routes.js publicForms.module.js publicForms.public.routes.js 
- **Own/feature tables:** `client_lead_stages`, `client_leads`
- **Spine tables read (Core — cannot be cut):** `client_organizations`
- **Cross-module code imports:** ../custom-fields/customFields.service 
- **Coupling read:** hard `require` into another domain → **coupled**, not cleanly separable.

See `_shared/CORE.md` for the spine; `_shared/domains/*/CONTRACTS.md` for shared domains.
