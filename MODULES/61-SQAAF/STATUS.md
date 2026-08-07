# 61 · SQAAF

**Domain:** Communication
**Status:** DEDUP REVIEW — a build now exists (07-Aug), and it overlaps four live modules

**What it is:** **Student Queries, Announcements, Alerts & Feedback.** Not a quality-assurance
framework — that was a guess made from the acronym before any code existed, and it was wrong.
The build's own README states the name.

> **Correction, 2026-08-07.** This file previously described SQAAF as a "School Quality
> Assurance and Assessment Framework" with a self-assessment cycle, evidence upload and an
> improvement plan. None of that is what was built. The expansion was inferred from four
> letters, not read from a source. Recorded rather than quietly overwritten, because the wrong
> description was published and someone may have read it.

## What it actually contains
- Student query desk (categories, comments, attachments, query numbers)
- Announcements (types, audience, view tracking)
- Alerts (types, priorities)
- Feedback (categories, statistics)
- Notifications (templates, audience groups)

## Why this is a dedup review, not a new module

Every one of those five already has a live home:

| SQAAF piece | We already ship |
|---|---|
| Student queries | **48-Helpdesk** (LIVE) |
| Announcements | **44-Announcements-and-Messages** (LIVE) |
| Alerts / notifications | **46-Notifications** (LIVE) |
| Feedback | **47-Feedback-Surveys** (LIVE) |

It holds a slot of its own only so it is never lost — **it is a bundle, not a module.** The
likely outcome of the review is that it dissolves into those four slots and this one closes.
Nothing here should be ported as "SQAAF"; §9 caps the sidebar and this adds no new menu.

See `CODE_MAP.md`, and `intake/SQAAF/PRD/` for the spec.

---

## Intake — the intern build for this module

| Build (in `intake/`) | Files | State | What is in the way |
|---|---|---|---|
| `intake/SQAAF/` | contract only *(build not imported yet)* | ⏳ PENDING | Build landed upstream 2026-08-07 (272 files · +22,541 lines) and is **not in this repo yet**. See below |

### The 07-Aug build — what was checked

Read from the upstream commit `a3a1252b`, not from a verdict:

- **Stack is close to ours:** Express 5 · **mysql2 / MariaDB** · JWT · bcrypt · zod. Not Mongo,
  not Postgres. The two real deltas are **TypeScript** (our backend is JavaScript) and
  **Express 5** (ours is 4).
- **Tenancy is present:** `org_id` on the parent tables — queries, announcements, alerts,
  notifications, and all six lookup tables.
- **Zero table collisions** — every table carries an `sqaaf_` prefix. That prefix is also the
  problem: our convention is `client_` for tenant data (`docs/process/TABLE_NAMING.md`).
- **Type mismatch:** it declares `org_id BIGINT UNSIGNED`; ours is `INT UNSIGNED`. A foreign
  key across that difference will not create.
- **Four child tables carry no `org_id`** — `sqaaf_query_comments`, `sqaaf_query_attachments`,
  `sqaaf_announcement_audience`, `sqaaf_announcement_views`. Scoped through their parent, which
  is defensible, but §6 says every tenant row carries `org_id` and these are tenant rows.
