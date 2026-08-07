# 34 · Payroll

**Domain:** Staff & HR
**Status:** PLACEHOLDER — the one real HR gap (SUG-0111)

**What it is:** Salary structures → payroll runs → payslips. Everything else in the HR suite is already native; this is the missing piece. School-simple, not GST/PF/ESI compliance (§7 defers that to a future connector).

## Features
- ('Coming Q2 2026' tab today)
- Scope source: Neha's HRMS build + EduSuite HR-Payroll contract — payroll ONLY

See `CODE_MAP.md` for where the LIVE code is, `PRD/PRD.md` for the spec.

---

## Intake — the intern/EduSuite build for this module

| Build (in `intake/`) | Files | State | What is in the way |
|---|---|---|---|
| `intake/HR-Payroll/` | 3 | ⏳ PENDING | Same gap — contract only, no payroll backend anywhere |
| `intake/HRMS-and-Payroll/` | 78 | ⏳ PENDING | **No payroll backend exists in either folder.** Build from the CONTRACT — best spec on the shelf |

Its own verdict, spec and source are inside that folder (`STATUS.md` · `PRD/` · `code/`). Port, never cut-paste — see `MODULES/INTAKE_ROADMAP.md`.
