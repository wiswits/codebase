# Code Map — Dashboard and Widgets

> The live code stays in `apps/` — this map points at it. **Never edit a copy; edit the
> real files below.** (A photocopy would rot; this map can't.)

## Backend
- `apps/backend/src/modules/dashboard/`
- `apps/backend/src/modules/widgets/`

## Frontend
- `apps/web/src/app/(dashboard)/dashboard/`

## Shared contract (every module)
- Registry: `apps/backend/src/core/registry.js` (MOUNT_ORDER)
- Nav: `apps/web/src/config/navConfig.ts`
- API client: `apps/web/src/lib/apiClient.ts`
- Migrations: `apps/backend/migrations/` (verify with `scripts/schema_inventory.js`)

## Shared spine & contracts (this repo — refine 2026-08-12)

- **Own code (frozen prod snapshot):** `code/apps/…` — dashboard.module.js dashboard.routes.js home.routes.js widgets.module.js widgets.routes.js 
- **Own/feature tables:** `client_assignment_submissions`, `client_assignments`, `client_attendance_records`, `client_attendance_sessions`, `client_book_issues`, `client_content_items`, `client_exam_marks`, `client_exam_sections`, `client_exam_subjects`, `client_exams`, `client_fee_assignments`, `client_fee_payments`, `client_lead_stages`, `client_leads`, `client_leave_requests`, `client_library_books`, `client_link_requests`, `client_messages`, `client_qb_chapters`, `client_qb_questions`, `client_qb_subjects`, `client_qb_topics`, `client_quiz_answers`, `client_quiz_attempts`, `client_quiz_questions`, `client_quizzes`, `client_recovery_worksheets`, `client_reportcard_publishes`, `client_staff`, `client_student_activity`, `client_student_bookmarks`, `client_student_moods`, `client_student_planner_tasks`, `client_student_study_time`, `client_student_weak_areas`, `client_subjects`, `client_timetable_config`, `client_timetable_slots`, `client_transport_vehicles`, `client_user_schools`
- **Spine tables read (Core — cannot be cut):** `client_classes`, `client_enrollments`, `client_parent_students`, `client_parents`, `client_roles`, `client_sections`, `client_students`, `client_user_roles`, `client_users`
- **Cross-module code imports:** ../hrms/leaves/leaveService 
- **Coupling read:** hard `require` into another domain → **coupled**, not cleanly separable.

See `_shared/CORE.md` for the spine; `_shared/domains/*/CONTRACTS.md` for shared domains.
