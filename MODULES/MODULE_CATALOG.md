# Module catalog — per-org provisioning & dependency closure

The machine-usable menu for onboarding. Onboard an org → pick modules → the
system enables the picked set **plus its dependency closure**, on top of CORE.

> **This is the missing wiring.** The platform already gates modules per org
> (`60-Module-Management`: `core`/`available`/`premium`/`off`, `moduleGate`,
> `client_feature_flags`, `planGate`). What it does NOT yet enforce is the
> **dependency graph** — the registry's `dependsOn` is empty. This catalog is
> that graph. Populate `dependsOn` in each `*.module.js` from the `requires`
> column, and the toggle can auto-close any subset.

## Legend
- **CORE** — always on, cannot be turned off (the platform floor).
- **STANDALONE** — needs only CORE. Free to pick alone.
- **SHARED-CLUSTER** — shares one code folder; enabling one enables the cluster.
- **DEPENDENT** — needs CORE + the listed module(s) to function.

## CORE (locked — every org gets this)
Identity & enrolment spine + org/auth/onboarding control plane. Not sellable-away.

`auth/roles` · 01-Students · 03-Parents-and-Linking · 08-Classes-and-Sections ·
57-Org-Settings · 58-School-Branch · 59-Onboarding · 60-Module-Management ·
46-Notifications · 54-Custom-Fields.

*(CORE membership is data-driven per org-type via `institution_modules.status='core'`;
this is the recommended technical floor — everything else imports it.)*

## The menu

| # | Module | Tier | requires (besides CORE) |
|---|---|---|---|
| 02 | Staff | STANDALONE* | (54-Custom-Fields — in CORE) |
| 04 | Admissions-CRM | STANDALONE | — |
| 05 | Groups | STANDALONE | — |
| 06 | Alumni | STANDALONE | — |
| 07 | Visitors | STANDALONE | — |
| 09 | Timetable | DEPENDENT | 08* |
| 10 | Student-Attendance | DEPENDENT | 08* |
| 11 | Assessments-and-Exams | DEPENDENT | 08* |
| 12 | Report-Cards | DEPENDENT | 11 · 10 · 08* |
| 14 | Question-Bank | STANDALONE | — |
| 15 | Quizzes-CBT | DEPENDENT | 14 |
| 16 | Worksheets | STANDALONE | — |
| 17 | Homework-Diary | STANDALONE | — |
| 18 | Curriculum-CIE | STANDALONE | — |
| 19 | Lesson-Content | STANDALONE | — |
| 20 | Personalised-Learning-Recovery | DEPENDENT | 11 (marks feed recovery) |
| 22 | Teaching-Canvas | STANDALONE | — |
| 24 | Events | STANDALONE | — |
| 25 | Gallery | STANDALONE | — |
| 26 | Calendar | STANDALONE | — |
| 31 | Staff-Attendance | SHARED-CLUSTER hr | hr cluster |
| 32 | Staff-Leaves | STANDALONE | — |
| 33 | Work-Reports-Scorecards | SHARED-CLUSTER hr | 31 · 19 (metrics) |
| 35 | Performance-PMS | SHARED-CLUSTER hr | hr cluster |
| 37 | EMPS-Extras | SHARED-CLUSTER hr | hr cluster |
| 39 | Fee-Structures | SHARED-CLUSTER fees | 08* |
| 40 | Fee-Collection-Ledger | SHARED-CLUSTER fees | 39 |
| 41 | Fee-Gateway | SHARED-CLUSTER payments | 40 |
| 43 | SaaS-Billing | STANDALONE (platform) | — |
| 44 | Announcements-Messages | STANDALONE | — |
| 45 | WhatsApp | STANDALONE | — |
| 47 | Feedback-Surveys | STANDALONE | — |
| 48 | Helpdesk | STANDALONE | — |
| 49 | Dashboard-and-Widgets | DEPENDENT | 32 |
| 50 | Analytics | STANDALONE | — |
| 51 | Reports-and-Exports | STANDALONE | — |
| 52 | AI-Tools | STANDALONE | — |
| 53 | AI-Config | STANDALONE | — |
| 55 | Public-Forms | STANDALONE* | (54 — in CORE) |
| 56 | Certificates | STANDALONE | — |

`*` = dependency resolves inside CORE, so no extra pick needed.
`08*` = 08-Classes-and-Sections; if it is treated as CORE, these become STANDALONE.

## Gaps (not on the menu until their intake ships)
13-HPC-Report-Card · 21-Student-Observations · 23-Wellbeing · 29-Hostel ·
30-Medical-Room · 34-Payroll · 36-Recruitment · 38-Utilization ·
42-Asset-and-Inventory · 61-SQAAF.

## Worked example (your ask)
- **Client 1 picks {Timetable(09), Assessments(11), Fee-Collection(40)}**
  → closure adds Fee-Structures(39); CORE already covers 08.
  → **enabled = CORE + 09 + 11 + 39 + 40.**
- **Client 2 picks {Attendance(10), Quizzes(15), Certificates(56)}**
  → closure adds Question-Bank(14).
  → **enabled = CORE + 10 + 14 + 15 + 56.**

Both are pure feature-flag config — same codebase, one onboarding step.

## To make it fully automatic (one live-code task)
1. Populate `dependsOn` in each `*.module.js` from the `requires` column above.
2. In `features.controller` toggle, expand the picked set to its `dependsOn`
   closure before writing flags (or block a pick whose deps are off, with a
   "also enables X" prompt).
3. Keep CORE `status='core'` for every org-type blueprint.

That closes the loop: **onboarding → pick modules → valid org-wise subset, every time.**
