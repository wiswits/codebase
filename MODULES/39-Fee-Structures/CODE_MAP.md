# Code Map — Fee Structures

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/erp/fees*.routes.js`

## Frontend
- `apps/web/src/app/(dashboard)/fees/`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared code & contracts (this repo — de-dup 2026-08-12)

Canonical copy lives once at:

- **Code:** `_shared/domains/fees/apps/backend/src/modules/erp/fees.routes.js`
- **This module's surface:** fee heads/components/structures/installments (`/api/fees`)
- **Full ownership + coupling map:** `_shared/domains/fees/CONTRACTS.md`

**Cross-module contracts:** downstream of People/Enrolment (students/classes/sections); boundary with Payments via `client_fee_*`.
