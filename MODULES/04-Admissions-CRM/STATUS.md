# 04 · Admissions CRM

**Domain:** People
**Status:** LIVE

**What it is:** The one admissions pipeline. Intern Admission/Registration builds are REJECTED as duplicates; only their number-series + document-checklist ideas may be absorbed here.

## Features
- Lead pipeline with stages + demos
- Public /apply/[token] intake
- Duplicate check
- Convert → student + admission number (ADM-<year>-<id>)

See `CODE_MAP.md` for where the LIVE code is, `PRD/PRD.md` for the spec.

---

## Intake — the intern/EduSuite build for this module

| Build (in `intake/`) | Files | State | What is in the way |
|---|---|---|---|
| `intake/Admission-Management/` | 99 | ⏳ PENDING | Our CRM is the base; diff for what it does better |
| `intake/Registration-Management/` | 50 | ⏳ PENDING | Our admissions is the base; diff for the delta |

Its own verdict, spec and source are inside that folder (`STATUS.md` · `PRD/` · `code/`). Port, never cut-paste — see `MODULES/INTAKE_ROADMAP.md`.
