# Code Map — Work Reports and Scorecards

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/hr/ (reports, /:id/scorecard)`

## Frontend
- `apps/web/src/app/(dashboard)/hr/ (?tab=work-reports)`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared code & contracts (this repo — de-dup 2026-08-12)

This module shares one live folder with the rest of the HR cluster. In this
library the canonical copy lives once at:

- **Backend:** `_shared/domains/hr/apps/backend/src/modules/hr/`
- **This module's surface:** `hr.work-reports` → `/api/hr/work-reports` — **auto_metrics derive from 31-Staff-Attendance + Content/CMS** (`client_hr_attendance`, `client_cms_*`); this coupling is load-bearing
- **Full ownership + coupling map:** `_shared/domains/hr/CONTRACTS.md`

**Cross-module contracts:** identity extends `client_users` (People/Core);
Core deps = auth · rbac · tenant · response · audit · meters.
