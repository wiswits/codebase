# Code Map — Onboarding

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/onboarding/`

## Frontend
- `public /apply; superadmin approval`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared spine & contracts (this repo — refine 2026-08-12)

- **Own code (frozen prod snapshot):** `code/apps/…` — onboarding.module.js onboarding.routes.js 
- **Own/feature tables:** `client_subscription_plans`, `client_subscriptions`
- **Spine tables read (Core — cannot be cut):** `client_organizations`, `client_roles`, `client_user_roles`, `client_users`
- **Cross-module code imports:** ../blueprints/blueprint.service 
- **Coupling read:** hard `require` into another domain → **coupled**, not cleanly separable.

See `_shared/CORE.md` for the spine; `_shared/domains/*/CONTRACTS.md` for shared domains.
