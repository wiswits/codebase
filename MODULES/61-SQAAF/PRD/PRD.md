# PRD — SQAAF

**Purpose.** **Student Queries, Announcements, Alerts & Feedback** — a student-facing query
desk with the announcement, alert, notification and feedback surfaces around it.

> **Correction, 2026-08-07.** An earlier version of this file described SQAAF as a "School
> Quality Assurance and Assessment Framework" with domains, indicators, evidence upload and an
> improvement plan, and said no code existed. **Both were wrong.** The expansion was inferred
> from the acronym; the build's own README says what it is. A build landed upstream on
> 2026-08-07 (272 files). Left visible rather than overwritten, because the wrong version was
> published first.

**There is no native spec here, and there should not be one yet.** This is a **dedup review**,
not a module to write a PRD for. Each of its five parts already has a live owner:

| Piece | Live owner |
|---|---|
| Student queries | `48-Helpdesk` |
| Announcements | `44-Announcements-and-Messages` |
| Alerts | `46-Notifications` |
| Feedback | `47-Feedback-Surveys` |
| Notification templates | `46-Notifications` |

**The work is a diff, not a port.** Read `intake/SQAAF/` piece by piece against those four
modules and pull only what is genuinely missing into the module that already owns it. Shipping
this as its own module would add a fifth way to send a school a message and a second place a
parent looks for a reply — and §9 caps the sidebar besides.

**If any part survives the diff**, it must be adapted first: `sqaaf_` → `client_` prefix
(`docs/process/TABLE_NAMING.md`), `org_id BIGINT UNSIGNED` → `INT UNSIGNED`, `org_id` added to
the four child tables that lack it, and TypeScript/Express 5 brought back to our JS/Express 4.

Current status: **DEDUP REVIEW** — see `../STATUS.md`.
