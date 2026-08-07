# 06 · Alumni

**Domain:** People
**Status:** SOON-GATED (one-flag flip; verify prod migration first)

**What it is:** Former-student directory. THREE builds exist (native, EduSuite port, Neha's Network+Mentorship) — one reconciliation pending; mentorship features not yet built.

## Features
- Directory + profile pages
- Backed by native client_alumni_profiles
- Lifecycle auto-creates profile on student → alumni

See `CODE_MAP.md` for where the LIVE code is, `PRD/PRD.md` for the spec.

---

## Intake — the intern/EduSuite build for this module

| Build (in `intake/`) | Files | State | What is in the way |
|---|---|---|---|
| `intake/Alumni-Directory/` | 69 | ✅ **MERGED** | On prod, `soon`-gated — one flag from live. `apps/backend/src/modules/alumni/` — 8 files · 456 lines |
| `intake/Alumni-Network-and-Mentorship/` | 42 | ⏳ PENDING | Third alumni build — one reconciliation, not a third table |

Its own verdict, spec and source are inside that folder (`STATUS.md` · `PRD/` · `code/`). Port, never cut-paste — see `MODULES/INTAKE_ROADMAP.md`.
