# Code Map — Personalised Learning Recovery

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/recovery/`
- `upgrade source: intake/Personalised-Learning/code/`

## Frontend
- `apps/web/src/app/(dashboard)/recovery/`
- `admin/personalized-learning/engines (in-page link)`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared spine & contracts (this repo — refine 2026-08-12)

- **Own code (frozen prod snapshot):** `code/apps/…` — recovery.module.js recovery.routes.js 
- **Own/feature tables:** `client_chapters`, `client_exam_marks`, `client_exam_subjects`, `client_exams`, `client_qb_chapters`, `client_qb_questions`, `client_qb_subjects`, `client_qb_subtopics`, `client_qb_topics`, `client_quiz_answers`, `client_quiz_attempts`, `client_quiz_questions`, `client_recovery_worksheets`, `client_student_learning_profiles`, `client_student_weak_areas`, `client_subjects`, `client_timetable_slots`, `client_topics`, `client_weak_areas`, `client_worksheet_assignments`
- **Spine tables read (Core — cannot be cut):** `client_classes`, `client_enrollments`, `client_parent_students`, `client_parents`, `client_sections`, `client_students`, `client_users`
- **Cross-module code imports:** none
- **Coupling read:** self-contained except the shared identity spine → **relatively separable** (standalone-ready).

See `_shared/CORE.md` for the spine; `_shared/domains/*/CONTRACTS.md` for shared domains.
