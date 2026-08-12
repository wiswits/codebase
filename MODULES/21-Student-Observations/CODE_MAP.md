# Code Map — Student Observations

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- (none) — upstream: intake/Student-Observations/code-incoming/

## Frontend
- (none)

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared spine & contracts (this repo — refine 2026-08-12)

- **Prod code snapshot:** none — this module has **no native live code** yet
  (`code/NOTE.md` marks the gap).
- **Intake build(s):** Student-Observations
- **Coupling:** no runtime coupling exists until it ships; when built it will
  stand on the CORE identity/enrolment spine (`_shared/CORE.md`) like every module.
- **To make final:** port its intake build (see `../INTAKE_ROADMAP.md`), then
  it gets the same tables/contracts pass as the live modules.
