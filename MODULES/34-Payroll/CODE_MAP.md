# Code Map — Payroll

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- (placeholder) — sources: intake/HRMS-and-Payroll/code/, intake/HR-Payroll/PRD/

## Frontend
- `apps/web/src/app/(dashboard)/hr/ (?tab=payroll placeholder)`
- `My Payslips nav item (soon, content-blocked)`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)
