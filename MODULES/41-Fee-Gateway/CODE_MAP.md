# Code Map — Fee Gateway

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/payments/ (fee-gateway config)`

## Frontend
- `Settings > Fee Gateway`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared code & contracts (this repo — de-dup 2026-08-12)

Canonical copy lives once at:

- **Code:** `_shared/domains/payments/apps/backend/src/modules/payments/`
- **This module's surface:** `payments.payments` + `payments.config` (`/api/payments`, `/api/payment-config`)
- **Full ownership + coupling map:** `_shared/domains/payments/CONTRACTS.md`

**Cross-module contracts:** reconciles Fees (`client_fee_payments/assignments` → 39/40); People identity; Razorpay via Core services.
