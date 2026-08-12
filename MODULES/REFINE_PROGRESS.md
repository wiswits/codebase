# Per-module refinement progress

Structure: **CORE → SHARED → MODULES**. Each module refined on 4 axes —
consistent structure · code review/cleanup · cross-module contracts · docs.

## Status: 61 / 61 modules have a contracts section ✅

- **CORE** — `_shared/CORE.md` (wiring spine + identity/enrolment tables)
- **SHARED** — `_shared/domains/{hr,payments,blueprints,fees,erp}/CONTRACTS.md`
- **MODULES** — every `NN-*/CODE_MAP.md` carries a *Shared spine & contracts*
  section (own code · own tables · spine tables read · cross-module imports).
- **Cross-module prod-code duplicates: 0.**

### Tiers of coupling
- **Deepest (cannot separate):** CORE spine + erp (01,03,08,09,10,11,12,27,28)
- **Wholly-shared domains:** hr (31,33,35,37), payments (41,43), blueprints (57,58), fees (39,40)
- **Standalone, but hard-`require` into another domain (coupled):**

  | Module | Hard import → depends on |
  |---|---|
  | 02-Staff | custom-fields |
  | 15-Quizzes-CBT | qbank (Question-Bank) |
  | 49-Dashboard-and-Widgets | hrms/leaves (Staff-Leaves) |
  | 54-Custom-Fields | features (Module-Management) |
  | 55-Public-Forms | custom-fields |
  | 59-Onboarding | blueprints |
  | 60-Module-Management | qbank |
  | 07-Visitors, 24-Events | internal core/shared query modules |

- **Relatively separable (only the spine):** 05-Groups, 06-Alumni, 14-Question-Bank,
  16-Worksheets, 17-Homework-Diary, 18-Curriculum-CIE, 19-Lesson-Content,
  20-PL-Recovery, 22-Teaching-Canvas, 25-Gallery, 26-Calendar, 44-Announcements,
  45-WhatsApp, 46-Notifications, 47-Feedback, 48-Helpdesk, 50-Analytics,
  51-Reports, 52-AI-Tools, 53-AI-Config, 56-Certificates.

### Gaps (no native prod code — port intake to finalize)
13-HPC-Report-Card · 21-Student-Observations · 23-Wellbeing · 29-Hostel ·
30-Medical-Room · 34-Payroll · 36-Recruitment · 38-Utilization ·
42-Asset-and-Inventory · 61-SQAAF. Each notes its intake build + points at
`INTAKE_ROADMAP.md`.

## What "full & final" means from here
For LIVE modules the contracts pass is complete (structure + tables + couplings
+ docs). The remaining depth — enriching each PRD and porting the 10 gap
builds — is per-module product work tracked in `INTAKE_ROADMAP.md` and
`FINAL_LAUNCH_PLAN.md`, and lands in `wiswits-code`, not this safe copy.
