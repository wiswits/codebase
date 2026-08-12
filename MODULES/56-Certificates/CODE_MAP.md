# Code Map — Certificates

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/certificates/`

## Frontend
- `Documents > Certificates`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared spine & contracts (this repo — refine 2026-08-12)

- **Own code (frozen prod snapshot):** `code/apps/…` — certificates.module.js certificates.routes.js certmgmt.public.routes.js certmgmt.routes.js 
- **Own/feature tables:** `client_cert_deliveries`, `client_cert_designs`, `client_cert_issued`, `client_cert_sequences`, `client_cert_settings`, `client_cert_signatories`, `client_cert_templates`, `client_cert_types`, `client_cert_verifications`, `client_certificates`, `client_timetable_slots`
- **Spine tables read (Core — cannot be cut):** `client_classes`, `client_enrollments`, `client_organizations`, `client_parent_students`, `client_parents`, `client_sections`, `client_students`, `client_users`
- **Cross-module code imports:** none
- **Coupling read:** self-contained except the shared identity spine → **relatively separable** (standalone-ready).

See `_shared/CORE.md` for the spine; `_shared/domains/*/CONTRACTS.md` for shared domains.
