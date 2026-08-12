# Code Map — Quizzes CBT

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/lms/`
- `apps/backend/src/modules/quiz-portal/`

## Frontend
- `apps/web/src/app/(dashboard)/assessment/quizzes/`
- `apps/quiz-portal/`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared spine & contracts (this repo — refine 2026-08-12)

- **Own code (frozen prod snapshot):** `code/apps/…` — analytics.routes.js assessment.routes.js attempt.routes.js bank.routes.js lms.module.js quiz-portal.module.js quizzes.routes.js 
- **Own/feature tables:** `client_audit_logs`, `client_courses`, `client_qb_chapters`, `client_qb_questions`, `client_qb_subjects`, `client_qb_topics`, `client_quiz_answers`, `client_quiz_attempts`, `client_quiz_config`, `client_quiz_questions`, `client_quizzes`, `client_student_activity`, `client_weak_areas`
- **Spine tables read (Core — cannot be cut):** `client_enrollments`, `client_organizations`, `client_parent_students`, `client_parents`, `client_sections`, `client_students`, `client_users`
- **Cross-module code imports:** ../qbank/libraryScope 
- **Coupling read:** hard `require` into another domain → **coupled**, not cleanly separable.

See `_shared/CORE.md` for the spine; `_shared/domains/*/CONTRACTS.md` for shared domains.
