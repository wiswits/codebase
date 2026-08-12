# HR domain — contracts & coupling map

One shared code folder (`_shared/domains/hr/`) serves **four product-modules**.
This file is the single source of truth for *who owns what* and *what cannot be
cut*. Grounded in the actual snapshot code, not intent.

## Route surfaces (from `hr.module.js`)

| Descriptor | Mount | File | Surface |
|---|---|---|---|
| `hr.employees`    | `/api/hr/employees`    | `employees.routes.js`   | Employee directory, departments, pods |
| `hr.attendance`   | `/api/hr/attendance`   | `attendance.routes.js`  | Geofenced check-in/out, policy, holidays |
| `hr.work-reports` | `/api/hr/work-reports` | `workReports.routes.js` | Daily reports, server-computed `auto_metrics`, scorecards |

`shared.js` is an in-module helper (`userCan`, `employeeFor`) — not a route; the registry ignores it.

## Product-module → surface ownership

| Module | Owns | Status | Note |
|---|---|---|---|
| **31-Staff-Attendance** | `hr.attendance` | LIVE | web `(dashboard)/hr/?tab=attendance` |
| **33-Work-Reports-and-Scorecards** | `hr.work-reports` | LIVE | reports + `/:id/scorecard`; web `?tab=work-reports` |
| **35-Performance-PMS** | *(extends the #33 scorecard)* | THIN | goals/review-cycles pending (`intake/HR-PMS`, 99 files) |
| **37-EMPS-Extras** | *(delta only)* | PARTIAL GAP | native hr covers attendance/reports/scorecards; **tasks/meetings/chat** missing (`intake/EMPS-Employee-Productivity`, 355 files) |
| *(substrate)* `hr.employees` | — | LIVE | employee identity every surface resolves through; no single customer-module name |

## Tables

**Owned by this domain**
- `client_hr_employees` — **EXTENDS `client_users` via `user_id`** (no parallel identity)
- `client_hr_attendance`, `client_hr_attendance_policy`, `client_hr_holidays`
- `client_hr_departments`, `client_hr_pods`
- `client_wr_reports`, `client_wr_report_items`

**Read from other domains — the couplings that cannot be cut**
- `client_users` → **Core / People identity** (token → employee, never payload)
- `client_cms_assets`, `client_cms_review_log`, `client_cms_topics` → **Content/CMS** (19-Lesson-Content · `cms.*`)
- `client_feature_flags` → **60-Module-Management**

## Why Work-Reports can't be separated

`workReports.computeAutoMetrics()` derives every number server-side from
**Staff-Attendance** (`client_hr_attendance`) + **Content/CMS** activity
(`client_cms_*`). The employee writes narrative; the system writes the metrics.
So **33-Work-Reports depends on 31-Staff-Attendance and the CMS module** — this
is the "coupling payoff" the code comment itself names, and it is load-bearing.

## Core (cross-everything) dependencies

`config/db` · `middleware/auth` (`authenticate`) · `middleware/rbac`
(`requirePermission`, `userCan`) · `middleware/tenant` (`rejectOrgIdInPayload`) ·
`utils/response` · `utils/audit` · `services/meters`.

## Findings / recommendations (review pass 2026-08-12)

1. **`hr.employees` is unowned substrate** — it underpins all four modules but
   maps to no customer-facing module name. Keep it explicitly as HR-core.
2. **`dependsOn` is empty in `hr.module.js`** though the code hard-reads
   `client_cms_*` and `client_hr_attendance`. When this reaches live refinement,
   declare those couplings so the registry validates them (declarative only).
3. Snapshot is frozen prod (`31210d4e`). Any *code* change happens in
   `wiswits/wiswits-code`, never here.
