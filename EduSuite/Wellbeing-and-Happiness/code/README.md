# 🌱 WISWITS APEX OS — Student Well-being & Counselling ("The Care Layer")

> Ye surveillance tool nahi hai. Ye care tool hai.
> This is not a surveillance tool. It is a care tool.

Implementation of the `wellbeing` module (API prefix `/api/wb`) from
[`WELLBEING_MODULE.md`](./WELLBEING_MODULE.md).

## Stack

| Layer | Tech |
|---|---|
| Frontend | React (Vite) |
| Backend | Node.js (Express) |
| Database | MySQL 8 |

## Repo layout

```
apps/
  backend/                 Node.js + Express API
    src/
      config/              db pool, env
      modules/wellbeing/   the Care Layer
    db/migrations/         SQL schema, grants, triggers
    tests/                 guardrail + unit tests (Jest)
  frontend/                React (Vite) app
docs/
  GUARDRAILS.md            the 21 promises, enforced
```

## The Prime Directive

Every design decision must pass one question:

> "Kya isse bachche ko madad milegi, ya bachche pe nazar rakhi jaayegi?"
> "Will this help the child, or surveil the child?"

If the answer is "surveil" — the feature does not get built.

## Build status (per PRD Part 12) — all 10 weeks complete

| Week | Scope | Status |
|---|---|---|
| 1 | Guardrails: constants, query linter, boot verification, DB schema + restricted user + grants + append-only audit triggers | ✅ |
| 2 | Consent ladder + AES-256-GCM journal crypto + anonymous reporter hash | ✅ |
| 3 | Crisis path: keyword scanner (EN/HI/Hinglish), escalation ladder, crisis screen, helplines | ✅ |
| 4 | Pulse + pattern analysis + retention cron, journal API, activities | ✅ |
| 5 | Signal engine: weights, hard caps, flags, event subscribers (event-only) | ✅ |
| 6 | Counsellor desk: cases + SLA, encrypted notes, referral, reason-gated context view, parent loop-in | ✅ |
| 7 | Student frontend: pulse, journal, self-raise, activities, consent | ✅ |
| 8 | Teacher + counsellor frontend | ✅ |
| 9 | Principal board + anonymous reporting | ✅ |
| 10 | Audit reports, guardrail-violation logging, staff/crisis/widget APIs, retention, docs | ✅ |

**Tests:** 139 passing across 8 suites (+ an opt-in live-MySQL integration suite).
See [`docs/DEFINITION_OF_DONE.md`](./docs/DEFINITION_OF_DONE.md) for the full
PRD Part-13 checklist and the remaining human-review / ops gates.

Docs: [`GUARDRAILS.md`](./docs/GUARDRAILS.md) ·
[`CRISIS_PROTOCOL.md`](./docs/CRISIS_PROTOCOL.md) ·
[`COUNSELLOR_GUIDE.md`](./docs/COUNSELLOR_GUIDE.md) ·
[`DEFINITION_OF_DONE.md`](./docs/DEFINITION_OF_DONE.md)

## Getting started

```bash
# Backend
cd apps/backend
cp .env.example .env      # fill in DB creds + secrets
npm install
npm run migrate           # runs db/migrations in order
npm run dev               # boots API (refuses to boot if a guardrail is broken)
npm test                  # runs the guardrail suite

# Frontend
cd apps/frontend
npm install
npm run dev
```
