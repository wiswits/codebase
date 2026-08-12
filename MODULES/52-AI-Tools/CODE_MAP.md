# Code Map — AI Tools

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/ai-tools/`

## Frontend
- `AI Tools menu`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared spine & contracts (this repo — refine 2026-08-12)

- **Own code (frozen prod snapshot):** `code/apps/…` — ai-tools.module.js aiTools.routes.js 
- **Own/feature tables:** `client_assignments`, `client_attendance_records`, `client_attendance_sessions`, `client_exam_marks`, `client_exam_subjects`, `client_exams`, `client_quiz_attempts`, `client_student_doubts`, `client_student_learning_profiles`, `client_student_weak_areas`, `client_subjects`, `client_timetable_slots`
- **Spine tables read (Core — cannot be cut):** `client_classes`, `client_enrollments`, `client_parent_students`, `client_parents`, `client_sections`, `client_students`, `client_users`
- **Cross-module code imports:** none
- **Coupling read:** self-contained except the shared identity spine → **relatively separable** (standalone-ready).

See `_shared/CORE.md` for the spine; `_shared/domains/*/CONTRACTS.md` for shared domains.
