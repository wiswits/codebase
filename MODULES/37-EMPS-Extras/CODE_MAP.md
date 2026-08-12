# Code Map — EMPS Extras

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/hr/ (existing)`
- `source for delta: intake/EMPS-Employee-Productivity/code/`

## Frontend
- (within /hr)

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared code & contracts (this repo — de-dup 2026-08-12)

This module shares one live folder with the rest of the HR cluster. In this
library the canonical copy lives once at:

- **Backend:** `_shared/domains/hr/apps/backend/src/modules/hr/`
- **This module's surface:** native hr covers attendance/reports/scorecards; only tasks/meetings/chat are the real gap (`intake/EMPS-Employee-Productivity`)
- **Full ownership + coupling map:** `_shared/domains/hr/CONTRACTS.md`

**Cross-module contracts:** identity extends `client_users` (People/Core);
Core deps = auth · rbac · tenant · response · audit · meters.
