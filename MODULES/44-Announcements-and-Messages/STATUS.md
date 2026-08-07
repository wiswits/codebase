# 44 · Announcements and Messages

**Domain:** Communication
**Status:** LIVE

**What it is:** School-to-community communication hub. A full Communication-Administration build
landed upstream on 2026-08-07 — the overlap must be settled before any of it is ported.

## Features
- Announcements + threaded messages
- Audience targeting (roles/classes)

See `CODE_MAP.md` for where the LIVE code is, `PRD/PRD.md` for the spec.

---

## Intake — the intern build for this module

| Build (in `intake/`) | Files | State | What is in the way |
|---|---|---|---|
| `intake/Communication-Administration/` | 3 *(contract only — build not imported yet)* | ⏳ PENDING | A real build landed upstream 2026-08-07 (233 files · +39,803 lines) and is **not in this repo yet**. See below |

Its own verdict, spec and source are inside that folder (`STATUS.md` · `PRD/` · `code/`). Port, never cut-paste — see `MODULES/INTAKE_ROADMAP.md`.

### 🔴 The 07-Aug build — two live-table collisions

Read from upstream commit `4ee4f365`, not from a verdict. **This is no longer "no code exists".**

**The good part.** The stack is ours: Express · **mysql2 / MariaDB** · JWT · bcrypt · Joi ·
Redis. Every table carries `org_id NOT NULL` and uses our `client_` prefix. On paper this is
the closest-to-portable build on the whole shelf.

**The dangerous part — the prefix that makes it look right is what makes it collide:**

| Its migration creates | We already run |
|---|---|
| `client_announcements` | 🔴 **JD Public School's live notice board.** Renamed to exactly this name **today** by migration `075` (commit `f2f0b06b`) — to protect it from the EMPS spec's bare `announcements`. The collision did not disappear; it moved onto the new name |
| `client_notifications` | 🔴 Live since migration `003`, written by **five** modules — notifications, announcements, HRMS leaves, value report, notificationService |

Both are `CREATE TABLE IF NOT EXISTS`. That does not error — **it silently does nothing**, and
the module then reads and writes a live school's rows against a different column set. This is
the same class as Hostel's `client_leave_requests`, and it fails without a single log line.

The other nine tables (`client_communication_channels`, `client_templates`, `client_broadcasts`,
`client_delivery_logs`, `client_audience_groups`, `client_email_queue`, `client_sms_queue`,
`client_communication_settings`) are free. **Settle the two collisions before importing.**
