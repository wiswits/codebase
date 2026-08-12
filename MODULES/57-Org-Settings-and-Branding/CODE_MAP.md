# Code Map — Org Settings and Branding

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/settings/`
- `apps/backend/src/modules/org/`
- `apps/backend/src/modules/branding/`
- `apps/backend/src/modules/blueprints/`

## Frontend
- `apps/web/src/app/(dashboard)/admin/settings/ (+ branding sub-page, no nav entry yet)`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared code & contracts (this repo — de-dup 2026-08-12)

Canonical copy lives once at:

- **Code:** `_shared/domains/blueprints/apps/backend/src/modules/blueprints/`
- **This module's surface:** `blueprints.institution` (`/api/institution`) — org identity, labels, branding, role blueprints
- **Full ownership + coupling map:** `_shared/domains/blueprints/CONTRACTS.md`

**Cross-module contracts:** **direct import of 54-Custom-Fields** (`customFields.service`); `client_feature_flags` (60).
