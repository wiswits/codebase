# Code Map — Reports and Exports

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/admin-reports/`
- `apps/backend/src/modules/valuereport/`

## Frontend
- `apps/web/src/app/(dashboard)/reports/`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared spine & contracts (this repo — refine 2026-08-12)

- **Own code (frozen prod snapshot):** `code/apps/…` — admin-reports.module.js reports.routes.js valuereport.routes.js 
- **Own/feature tables:** `client_assignment_submissions`, `client_assignments`, `client_attendance_config`, `client_attendance_sessions`, `client_audit_logs`, `client_cert_issued`, `client_fee_assignments`, `client_fee_payments`, `client_hr_holidays`, `client_notifications`, `client_payment_orders`, `client_quiz_attempts`, `client_quiz_questions`, `client_quizzes`, `client_reportcard_publishes`, `client_subjects`, `client_whatsapp_messages`, `client_worksheets`
- **Spine tables read (Core — cannot be cut):** `client_classes`, `client_enrollments`, `client_sections`, `client_students`, `client_users`
- **Cross-module code imports:** none
- **Coupling read:** self-contained except the shared identity spine → **relatively separable** (standalone-ready).

See `_shared/CORE.md` for the spine; `_shared/domains/*/CONTRACTS.md` for shared domains.
