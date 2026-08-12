# Packaging & sell manifest — what ships with what

Answers one question per module: **to sell it, what must go in the box?**

> **CORE is in every box.** Every module reads the identity/enrolment spine,
> auth, registry and nav (`_shared/CORE.md`). Nothing sells without CORE — so
> "independent" below means **CORE + that module only**, no other domain or
> sibling module needed. (Gap modules — no native code yet — are listed at the
> end; port their intake first.)

---

## A. Independent sell  =  CORE + the module alone
Reads only the shared spine; no cross-domain code import; not in a shared
cluster. Cleanest to package and sell on its own.

| # | Module |
|---|---|
| 05 | Groups |
| 06 | Alumni |
| 14 | Question-Bank |
| 16 | Worksheets |
| 17 | Homework-Diary |
| 18 | Curriculum-CIE |
| 19 | Lesson-Content |
| 20 | Personalised-Learning-Recovery |
| 22 | Teaching-Canvas |
| 25 | Gallery |
| 26 | Calendar |
| 44 | Announcements-and-Messages |
| 45 | WhatsApp |
| 46 | Notifications |
| 47 | Feedback-Surveys |
| 48 | Helpdesk |
| 50 | Analytics |
| 51 | Reports-and-Exports |
| 52 | AI-Tools |
| 53 | AI-Config |
| 56 | Certificates |

**Box = CORE + module.** (21 modules.)

---

## B. CORE + SHARED domain + module(s)
These live on a **shared domain folder** (`_shared/domains/<d>/`). You cannot
ship one product-module without its shared code — and since the siblings share
the *same* folder, you realistically ship the whole cluster.

| Bundle | Box = CORE + shared domain + these modules | Extra pull |
|---|---|---|
| **HR** | `_shared/domains/hr` + 31-Staff-Attendance, 33-Work-Reports, 35-Performance-PMS, 37-EMPS-Extras | Work-Reports metrics also read CMS (19) + Attendance |
| **Payments** | `_shared/domains/payments` + 41-Fee-Gateway, 43-SaaS-Billing | Fee-Gateway needs **Fees** to reconcile |
| **Blueprints** | `_shared/domains/blueprints` + 57-Org-Settings, 58-School-Branch | **+ 54-Custom-Fields** (hard `require`) |
| **Fees** | `_shared/domains/fees` + 39-Fee-Structures, 40-Fee-Collection | **+ Payments** for settlement |

**Box = CORE + shared-domain + cluster modules (+ noted pulls).**

---

## C. CORE + module + one/few dependency modules
Standalone in structure, but with a hard `require` into another module. Ship the
dependency too.

| Module | Also ship |
|---|---|
| 02-Staff | 54-Custom-Fields |
| 15-Quizzes-CBT | 14-Question-Bank |
| 49-Dashboard-and-Widgets | 32-Staff-Leaves |
| 54-Custom-Fields | 60-Module-Management |
| 55-Public-Forms | 54-Custom-Fields |
| 59-Onboarding | Blueprints bundle (57/58 + Custom-Fields) |
| 60-Module-Management | 14-Question-Bank |
| 07-Visitors · 24-Events | their internal core/shared query helpers (bundle with the module) |

**Box = CORE + module + listed dependency.**

---

## D. Not separable — platform-only (or sell the academic core whole)
The `erp` / People spine. Selling any one drags the enrolment spine and usually
its siblings.

| # | Module | Why it can't go alone |
|---|---|---|
| 01 | Students | is the spine (identity) |
| 03 | Parents-and-Linking | aggregates assignments/quizzes/worksheets/messages/fees |
| 08 | Classes-and-Sections | anchors enrolment for 10/11/12/27/28 |
| 09 | Timetable | needs sections↔subjects↔teachers |
| 10 | Student-Attendance | per-session against enrolment; feeds 12 + HR |
| 11 | Assessments-and-Exams | marks feed 12 |
| 12 | Report-Cards | downstream of 11 + 10 + 08 |
| 27 | Library | members = real students (enrolment) |
| 28 | Transport | assignees = real students (enrolment) |

**Box = the whole People/Academic core, or keep in platform.**

---

## E. Gaps — nothing to sell yet
No native prod code. Port the intake build first (`INTAKE_ROADMAP.md`), then it
lands in A/B/C/D.

13-HPC-Report-Card · 21-Student-Observations · 23-Wellbeing · 29-Hostel ·
30-Medical-Room · 34-Payroll · 36-Recruitment · 38-Utilization ·
42-Asset-and-Inventory · 61-SQAAF.

---

### Quick counts
- **A. Independent (CORE + module):** 21
- **B. Shared-domain bundles:** 4 bundles (10 modules)
- **C. Module + dependency:** 8 modules
- **D. Platform-only academic core:** 9 modules
- **E. Gaps (port first):** 10 modules

Per-module detail lives in each `MODULES/NN-*/CODE_MAP.md` → *Shared spine &
contracts*, and in `_shared/domains/*/CONTRACTS.md`.
