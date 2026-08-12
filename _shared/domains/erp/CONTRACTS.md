# ERP domain — contracts & coupling map

The `erp` backend domain is **not** wholly-shared like hr/payments: each product
module owns its **own** routes file (already de-duplicated). What binds them is
the shared **identity/enrolment spine** (see `_shared/CORE.md`). This file maps
each module's own file + tables, and the spine every one of them stands on.

## Module → own routes file + owned tables

| # | Module | Routes file | Owns (feature tables) |
|---|---|---|---|
| 01 | Students | `students.routes.js` | `client_students`, `client_student_change_requests`, `client_link_requests` |
| 03 | Parents-and-Linking | `parents.routes.js` | `client_parents`, `client_parent_students`, `client_parent_meetings` |
| 08 | Classes-and-Sections | `classes.routes.js` | `client_classes`, `client_sections`, `client_enrollments`, `client_teacher_subjects` |
| 09 | Timetable | `timetable.routes.js` | `client_timetable`, `client_timetable_slots`, `client_timetable_config` |
| 10 | Student-Attendance | `attendance.routes.js` | `client_attendance_sessions`, `client_attendance_records`, `client_attendance_config` |
| 11 | Assessments-and-Exams | `assessments.routes.js` | `client_exams`, `client_exam_subjects`, `client_exam_sections`, `client_exam_marks` |
| 12 | Report-Cards | `reportcards.routes.js` | `client_reportcard_settings`, `client_reportcard_publishes` |
| 27 | Library | `library.routes.js` | `client_library_books`, `client_library_members`, `client_book_issues`, `client_book_categories` |
| 28 | Transport | `transport.routes.js` | `client_transport_routes/stops/trips/vehicles/staff`, `client_student_transport` |

*(39-Fee-Structures / 40-Fee-Collection also live in `erp` as `fees.routes.js`
— see `_shared/domains/fees/CONTRACTS.md`.)*

## The shared spine — read by EVERY module above (cannot be cut)
`client_users` · `client_students` · `client_enrollments` · `client_sections` ·
`client_classes` (+ `client_roles`, `client_user_roles`). Anchored by 01/08/03
and Core/auth. This is why the erp modules read as separate but ship as one.

## Notable cross-module couplings (grounded in code)
- **01-Students** is the hub: reads attendance, library, fees and timetable
  tables to render one student view; also imports `custom-fields/customFields.service`.
- **03-Parents-and-Linking** (1256 lines) aggregates the widest — it reads
  assignments, quizzes, worksheets, messages, meetings, attendance and fees to
  build the parent portal. It is coupled to almost every academic module.
- **12-Report-Cards** joins `client_exam_marks` (11-Assessments) + attendance +
  enrolment — it is downstream of 11, 10 and 08.
- **10 / 27 / 28** each resolve a real learner through `client_enrollments`, so
  none works without 01 + 08.

## Refinement note
Feature tables are cleanly per-module; the coupling is the spine, by design.
Any de-coupling attempt must first extract the spine as an explicit shared
service — a live-code (`wiswits-code`) change, not a library edit.
