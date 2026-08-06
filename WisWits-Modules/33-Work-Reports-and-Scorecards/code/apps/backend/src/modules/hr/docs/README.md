# hr module — Employee Management

**Owns:** employee profiles (extending `client_users` via `user_id` — no parallel identity),
departments, pods, geofenced employee attendance (distinct from `/api/attendance`
class-marking), and daily work reports with **server-computed `auto_metrics`**.
**Does NOT own leave** — the existing `/api/leaves` (hrms) module is reused.

**Tables:** `client_hr_employees` · `client_hr_departments` · `client_hr_pods` ·
`client_hr_attendance` · `client_hr_attendance_policy` · `client_hr_holidays` ·
`client_wr_reports` · `client_wr_report_items` (migrations 011–012; manual-only
down scripts in `migrations/down/`).

## Routes (prefix → file)

- `/api/hr/employees` → `employees.routes.js`
  `GET /departments|/pods` (hr.view) · `POST /departments|/pods` (hr.employee.create) ·
  `GET /me` (hr.employee.view_self) · `GET /team` (hr.employee.view_team) ·
  `GET /`, `GET /:id` (hr.employee.view_all) · `GET /:id/scorecard` (hr.employee.view_team) ·
  `POST /` (hr.employee.create) · `PATCH /:id` (hr.employee.update) ·
  `PATCH /:id/deactivate` (hr.employee.deactivate)
- `/api/hr/attendance` → `attendance.routes.js`
  `POST /check-in|/check-out`, `GET /me|/policy|/holidays` (hr.attendance.mark_self) ·
  `GET /team` (hr.attendance.view_team) · `GET /` (hr.attendance.view_all) ·
  `PATCH /:id/override` (hr.attendance.override, audit-logged) ·
  `PUT /policy`, `POST|DELETE /holidays` (hr.attendance.policy_manage)
- `/api/hr/work-reports` → `workReports.routes.js`
  `GET /me/today`, `POST /` (hr.workreport.submit) · `GET /team|/:id`
  (hr.workreport.view_team) · `PATCH /:id/review` (hr.workreport.review, SoD)

## Invariants (tested in tests/hr-cms-tamper.test.js + hr-cross-org.test.js)

- `auto_metrics` is computed at submit time from `client_cms_assets` +
  `client_cms_review_log` + `client_hr_attendance`; any client-supplied value is
  **stripped unconditionally** — never merged.
- Server-computed, never accepted: `total_hours`, `late_by_minutes`, check-in
  stamps/method, `approved_by`, report reviewer fields.
- Immutable via API: `employee_code`; `user_id` create-only; `status` only via
  `/deactivate`. `org_id` from the token only (`rejectOrgIdInPayload` everywhere).
- Geofence (haversine) enforced server-side when `require_geo` is on.
- Tier scoping (view_all vs view_team) uses rbac's **exported** `hasPermission`
  (`shared.js userCan`) — never a forked copy of the middleware.

## Rollback / kill-switch (corrected after the Step-5 schema capture)

**Do NOT plan on `platform_features.status='suspended'` — that value cannot be
stored.** Prod's `status` column is ENUM('live','beta','coming_soon','planned');
the suspended/inactive/private/pilot stages the code queries do not exist at the
schema level (SUG-0084). The working kill-switches are:
1. Per org: `client_feature_flags` row `(org_id, feature_key, is_enabled=0)` —
   hides the sidebar item instantly, no deploy.
2. Global: `UPDATE platform_features SET status='planned' WHERE feature_key=...`
   — valid enum value, visible only inside org 1 (platform HQ).
3. Code: remove the module names from `MOUNT_ORDER` + revert the module folder
   (one PR revert; loader + orphan-guard stay green only if both halves go).
DB rollback: `migrations/down/011–012` (manual-only, see that folder's README).

## Gotchas

- **Express 5**: `path-to-regexp` v8 rejects `:id(\d+)` inline regexes — use
  plain `:id` and declare literal paths (e.g. `/reorder`, `/me`) BEFORE `/:id`.
- Known gap: repo has no base `schema.sql` — run `scripts/dump-schema.sh` on the
  server to capture it (until then local envs bootstrap tables ad-hoc).
- Permission keys live in `scripts/migrations/015_hr_cms_permission_catalog.js`;
  sidebar rows in `scripts/hr_cms_features_migration.js`.
