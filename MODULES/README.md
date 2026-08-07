# MODULES — every module WisWits has, one folder each

**One folder per module. No module appears twice, anywhere in this repo.**

There used to be two shelves here — `WisWits-Modules/` (what prod runs) and a separate
intern shelf — and 26 of the intern modules were a second folder for something the
first shelf already had a slot for. Alumni had three. Payroll had two. That is gone: the
intern build now lives **inside** the module it belongs to, as `intake/`.

## Layout — the same shape for all 61

```
MODULES/
  NN-<Module-Name>/
    STATUS.md      what it is, domain, status, features — and the Intake table
    CODE_MAP.md    where the LIVE code is in wiswits-code (never edit a copy)
    PRD/PRD.md     the native spec
    code/          frozen prod snapshot (commit 31210d4e) — or code/NOTE.md if none exists
    intake/        the intern build, ONLY where one exists
      <Build-Name>/
        STATUS.md    the intern-side verdict
        PRD/         their spec (PRD+CTO+Engineering+Analysis, or the CONTRACT)
        code/        their build (or code-incoming/ where it was never assembled)
```

`intake/` is nested one level deep on purpose: three slots receive **two** intern builds
(06-Alumni, 34-Payroll, 04-Admissions-CRM), and each needs to stay its own readable thing
until it is reconciled.

## Where each intern build stands

- **26 intern builds**, folded into **23 module slots**.
- ✅ **5 MERGED** — their logic is inside the product today (~10,000 lines running or ready to run).
- ⏳ **21 PENDING** — each row in a module's STATUS.md says exactly what is in the way.

> **Moving target, 2026-08-07.** Two builds landed upstream *after* this catalogue was written
> — **Communication Administration** (233 files · +39,803 lines) and **SQAAF** (272 files ·
> +22,541 lines), both by Khushboo, both the same day. Neither is in this repo yet; their
> `intake/` folders still hold only the old contract. **"Contract only, zero code" is now true
> of two modules, not four** — Biometric Attendance and Medical Room. Read
> `44-Announcements-and-Messages/STATUS.md` and `61-SQAAF/STATUS.md` before acting on either:
> one carries two live-table collisions, the other turned out not to be the module its acronym
> suggested.

**MERGED means ported, not copied.** Most of these cannot be cut-pasted: some are MongoDB
apps against our MariaDB, some carry no `org_id` at all (every school would see every other
school's records), one collides with JD Public School's live staff leave register. The port
keeps their logic, screens and PRDs; the plumbing underneath is ours. Wellbeing is the
proof — 2,942 lines of intern work in the product, consent ladder and crisis scanner intact.

## The index

| Module | Domain | Status | Prod snapshot files | Intake builds |
|---|---|---|---|---|
| **01-Students** | People | LIVE | 6 | — |
| **02-Staff** | People | LIVE | 4 | — |
| **03-Parents-and-Linking** | People | LIVE (link surface partially wired) | 5 | — |
| **04-Admissions-CRM** | People | LIVE | 13 | ⏳ Admission-Management<br>⏳ Registration-Management |
| **05-Groups** | People | SOON-GATED (one-flag flip ready) | 4 | — |
| **06-Alumni** | People | SOON-GATED (one-flag flip; verify prod migration first) | 10 | ✅ Alumni-Directory<br>⏳ Alumni-Network-and-Mentorship |
| **07-Visitors** | People | SOON-GATED (DONE — flow-test + flag flip only) | 15 | ✅ Visitor-Management |
| **08-Classes-and-Sections** | Academics | LIVE | 11 | — |
| **09-Timetable** | Academics | LIVE | 3 | — |
| **10-Student-Attendance** | Academics | LIVE | 2 | — |
| **11-Assessments-and-Exams** | Academics | LIVE | 9 | ⏳ Exam-Cell-and-Result-Management |
| **12-Report-Cards** | Academics | LIVE | 3 | — |
| **13-HPC-Report-Card** | Academics | GAP — build ready, blocked on AK's call: who supplies the competency list | — (placeholder) | ⏳ HPC-Report-Card |
| **14-Question-Bank** | Academics | LIVE | 5 | — |
| **15-Quizzes-CBT** | Academics | LIVE | 38 | ⏳ Coaching-and-Test-Series |
| **16-Worksheets** | Academics | LIVE | 3 | — |
| **17-Homework-Diary** | Academics | LIVE | 3 | — |
| **18-Curriculum-CIE** | Academics | SOON-GATED (one-flag flip ready) | 17 | — |
| **19-Lesson-Content** | Academics | LIVE | 11 | — |
| **20-Personalised-Learning-Recovery** | Academics | LIVE (thin) — upgrade path ready | 5 | ✅ Personalised-Learning |
| **21-Student-Observations** | Academics | GAP — blocked upstream (the intern team never assembled it) | — (placeholder) | ⏳ Student-Observations |
| **22-Teaching-Canvas** | Academics | BUILT, NO NAV — wire or park decision pending | 4 | — |
| **23-Wellbeing-and-Happiness** | Student Life | SOON-GATED — cycle 1 ported and on prod (the `code/` snapshot predates it; live paths are in `CODE_MAP.md`). Cycle 2 = counsellor desk | — (placeholder) | ✅ Wellbeing-and-Happiness |
| **24-Events** | Student Life | LIVE | 31 | ✅ Event-Management |
| **25-Gallery** | Student Life | LIVE | 5 | — |
| **26-Calendar** | Student Life | LIVE | 5 | — |
| **27-Library** | Student Life | LIVE | 3 | ⏳ Library-Management |
| **28-Transport** | Student Life | LIVE | 3 | — |
| **29-Hostel-Management** | Student Life | GAP — most mature intern build, ready to port | — (placeholder) | ⏳ Hostel-Management |
| **30-Medical-Room** | Student Life | HOLD — §16-gated non-goal, AK's explicit call required | — (placeholder) | ⏳ Medical-Room |
| **31-Staff-Attendance** | Staff & HR | LIVE | 9 | ⏳ Biometric-Attendance |
| **32-Staff-Leaves** | Staff & HR | LIVE | 6 | — |
| **33-Work-Reports-and-Scorecards** | Staff & HR | LIVE | 9 | — |
| **34-Payroll** | Staff & HR | PLACEHOLDER — the one real HR gap (SUG-0111) | 3 | ⏳ HR-Payroll<br>⏳ HRMS-and-Payroll |
| **35-Performance-PMS** | Staff & HR | THIN — scoped extension pending | 7 | ⏳ HR-PMS |
| **36-Recruitment** | Staff & HR | GAP — port cycle 1 started (cleanest build on the shelf, zero collisions) | — (placeholder) | ⏳ Recruitment-Management |
| **37-EMPS-Extras** | Staff & HR | PARTIAL GAP — only tasks/meetings/chat missing | 7 | ⏳ EMPS-Employee-Productivity |
| **38-Utilization** | Staff & HR | HOLD — blocked upstream + low priority | — (placeholder) | ⏳ Utilization-Management |
| **39-Fee-Structures** | Finance | LIVE | 3 | — |
| **40-Fee-Collection-and-Ledger** | Finance | LIVE | 3 | — |
| **41-Fee-Gateway** | Finance | CONFIG EXISTS — verify end-to-end before marketing | 6 | — |
| **42-Asset-and-Inventory** | Finance | GAP — intern build ready | — (placeholder) | ⏳ Asset-and-Inventory |
| **43-SaaS-Billing** | Finance | MANUAL AT LAUNCH (LOCKED by AK) | 19 | — |
| **44-Announcements-and-Messages** | Communication | LIVE | 8 | ⏳ Communication-Administration |
| **45-WhatsApp** | Communication | LIVE | 3 | — |
| **46-Notifications** | Communication | LIVE (chrome) | 3 | — |
| **47-Feedback-Surveys** | Communication | LIVE | 3 | — |
| **48-Helpdesk** | Communication | LIVE | 11 | — |
| **49-Dashboard-and-Widgets** | Intelligence | LIVE | 7 | — |
| **50-Analytics** | Intelligence | LIVE | 4 | — |
| **51-Reports-and-Exports** | Intelligence | LIVE | 7 | — |
| **52-AI-Tools** | Intelligence | LIVE | 3 | — |
| **53-AI-Config** | Intelligence | LIVE | 4 | — |
| **54-Custom-Fields** | Platform | LIVE | 5 | — |
| **55-Public-Forms** | Platform | LIVE | 5 | — |
| **56-Certificates** | Platform | LIVE | 66 | ⏳ Certificates-and-Documents |
| **57-Org-Settings-and-Branding** | Platform | LIVE (branding page needs nav wiring) | 18 | — |
| **58-School-Branch-Management** | Platform | BE BUILT, THIN SURFACE — wiring item | 7 | — |
| **59-Onboarding** | Platform | LIVE | 4 | — |
| **60-Module-Management** | Platform | BUILT, DARK — Features page unbuilt (BE mounted) | 6 | — |
| **61-SQAAF** | Communication | DEDUP REVIEW — a bundle overlapping 44/46/47/48; build landed upstream 07-Aug | — (placeholder) | ⏳ SQAAF |

## Known state — what is still duplicated, and why it stays

Audited 2026-08-07. Two things repeat on purpose; one repeated by accident and is fixed.

- **28 snapshot files live in more than one slot.** One live source file often serves
  several modules — `hr/shared.js` sits in 31/33/35/37, `blueprint.service.js` in 57/58,
  the report-cards page in 11/12. **Left as-is deliberately:** each `code/` folder is a
  self-contained, restorable snapshot of that module; deduping would break the one job
  this repo has. `CODE_MAP.md` is always the authority on where the real file is.
- **Boilerplate repeats inside `intake/`** — identical `tsconfig.json`, `.env.example`
  across independent intern projects. Not duplication of *work*; leave it.
- **`_shared/CLAUDE.md` was a dead symlink** pointing at `docs/CLAUDE.md`, a path that
  only exists in wiswits-code. The constitution — the most important shared file here —
  resolved to nothing. Now a real 446-line file.

**56 zero-byte files, all inside `intake/`** (25 Recruitment · 21 EMPS · 10 across five
others). Not corruption and not ours to clean: that is the interns' actual delivery state
— including 19 of Recruitment's 21 frontend components. Nothing imports them, so no gate
ever noticed. **The prod snapshot has zero empty files.** A file count here means "how
much there is to look at", never "how much work exists".

## Companions

- `MODULES/INTAKE_ROADMAP.md` — the sequencing plan for porting the 21 pending builds
- `MODULES/INTAKE_SOURCES.md` — where each intern build came from (which repo, whose folder)
- `_shared/` — constitution, PRODUCT_PRD, FINAL_LAUNCH_PLAN, registry, navConfig, apiClient

**Prod safety:** this whole folder is documentation and frozen copies. Nothing here is
imported, built, or deployed. The runnable platform is `wiswits/wiswits-code` → `apps/`.
