# 07 · Visitors

**Domain:** People
**Status:** SOON-GATED (DONE — flow-test + flag flip only)

**What it is:** Who is in the building, signed in by the front desk. Ported from EduSuite via the intake pipeline — the reference port.

## Features
- Front-desk check-in register
- Host lookup by name
- Printable visitor pass
- Gate-pass sub-module

See `CODE_MAP.md` for where the LIVE code is, `PRD/PRD.md` for the spec.

---

## Intake — the intern/EduSuite build for this module

| Build (in `intake/`) | Files | State | What is in the way |
|---|---|---|---|
| `intake/Visitor-Management/` | 116 | ✅ **MERGED** | On prod, `soon`-gated — one flag from live. `apps/backend/src/modules/visitors/` — 13 files · 814 lines |

Its own verdict, spec and source are inside that folder (`STATUS.md` · `PRD/` · `code/`). Port, never cut-paste — see `MODULES/INTAKE_ROADMAP.md`.
