# 🎯 WISWITS APEX OS — Personalized Learning Module (`pl`)

**Codename:** The Loop Engine · **API prefix:** `/api/pl` · **Stack:** React + Node.js + MySQL/MariaDB

> Baaki modules school chalate hain. Ye module bachche ko badalta hai.
> Har test ko diagnosis banata hai — phir diagnosis se ilaaj, automatically.

Full product spec: [`PERSONALIZED_LEARNING_MODULE.md`](./PERSONALIZED_LEARNING_MODULE.md).

---

## What's in this repo

```
backend/          Node.js + Express + MariaDB
  src/
    algorithms/   ⭐ the 8 pure algorithm cores (the moat) — 100% unit-testable
    db/           schema (22 tables) + migration runner + fixtures + self-contained seed
    external/     QBank + Curriculum adapters (HTTP; NEVER require() across modules)
    routes/       full API surface (/api/pl/*) — 25 route files
    lib/          event bus (the 12 pl.* contract events)
    middleware/   org scoping + requirePermission
  tests/          163 tests across 16 suites, integration-tested against the live seeded DB
frontend/         React + Vite, 27 pages across Teacher/Student/Parent/Principal
  src/pages/      role-tabbed nav — see Shell.jsx
  src/components/ Panel/StatCard/Bar + chart library (LineChart, RadarChart, Donut,
                   Histogram, HeatmapGrid, StackedBar) — all dependency-free SVG/HTML
```

## Quick start

### Backend
```bash
cd backend
cp .env.example .env          # point DB_* at your MySQL/MariaDB; USE_MOCK_EXTERNAL=true
npm install
npm test                      # 163 tests — algorithms are DB-free, routes hit the live seed
npm run migrate               # creates the 22 client_pl_* tables (additive — safe on a shared DB)
npm run seed                  # demo org 9001, 500 students, 6 tests, 60k responses, real weak
                               # areas/recovery cycles/root-cause chains derived from real data
npm start                     # boots API on :4010
```

Try the brain live:
```bash
curl -s -X POST localhost:4010/api/pl/analyze/weak-areas \
  -H 'content-type: application/json' -H 'x-role: teacher' \
  -d '{"now":"2026-07-16T00:00:00Z","topics":[
        {"wiswits_id":"MATH10C07T01","subject_id":1,"attempted":8,"accuracy":28,"last_attempt_at":"2026-07-14","variance":5},
        {"wiswits_id":"MATH10C03T02","subject_id":1,"attempted":8,"accuracy":34,"last_attempt_at":"2026-07-14","variance":5},
        {"wiswits_id":"MATH10C01T02","subject_id":1,"attempted":8,"accuracy":41,"last_attempt_at":"2026-07-14","variance":5}]}'
# → Ch01 is the ROOT; Ch03 (depth 1) and Ch07 (depth 2) are symptoms.
```

### Frontend
```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173  (proxies /api → :4010)
```
Open the app — a role switcher (Teacher / Student / Parent / Principal) sits at the top;
each tab shows that role's pages.

---

## Status — what's built

| Layer | Status |
|---|---|
| **Data model** — 22 tables, Blocks A–F, org-scoped, snapshot-safe | ✅ migrated additively into the live platform DB |
| **Algorithm brain** — all 8 cores (weak detect, root cause, behaviour, distractor, worksheet, cycle, benchmark, SM-2) | ✅ implemented + tested |
| **Event bus** — 12 `pl.*` contract events | ✅ |
| **External contract** — QBank/Curriculum via adapters, mock + HTTP | ✅ no cross-module `require()` |
| **API surface** — test builder, blueprints, offline+online attempts, assignments, worksheets, recovery cycles, profiles, all analytics tiers (attempt/test/student/class/school), weak-areas, insights/alerts/digest, adaptive practice, widgets, OMR/CSV | ✅ ~69 endpoints across 25 route files |
| **Frontend** — 27 pages: Teacher (dashboard, test builder, blueprints, assignments, weak-areas heatmap, student deep-dive, worksheets, insights, offline marks entry, test analytics hero, distractors), Student (dashboard, tests, attempt engine, results, weak-areas, worksheets, practice, progress report), Parent (overview, progress, full report), Principal (recovery stats, subject health) | ✅ |
| Seed data | ✅ self-contained, reversible (`node src/db/seed.js --clean`), derives weak-areas/root-cause/recovery-cycles from real response rows (not a disconnected random pass) |

### Honest simplifications (called out, not hidden)
- **No real auth** — org/role/user come from request headers (`x-org-id`, `x-role`, `x-user-id`), not JWTs/sessions. Swapping in real auth only touches `middleware/context.js`.
- **No roster table** — the platform has no `class`/`section` membership table for these demo students, so "class"-scoped routes aggregate org-wide and say so in their response/comments.
- **No PDF library** — worksheet/print/OMR-template endpoints return fully structured JSON (questions, options, solutions) instead of a real PDF; a frontend can render + `window.print()`. Documented at each such route.
- **OMR is JSON-simulated** — `POST /tests/:id/omr-upload` accepts structured bubble-mark JSON, not real image upload (no image-processing dependency was added).
- **QBank/Curriculum are mock adapters** (`src/external/mockAdapters.js`) — swap `USE_MOCK_EXTERNAL=false` once those modules exist; the HTTP adapter shape is already written (`httpAdapters.js`).

## Bugs found and fixed during integration
Building at this scale surfaces real bugs — two were caught by cross-checking agent-built
code against the live seeded DB rather than trusting reports at face value:
1. **A hang, not an error** — a query in `worksheets.js` mixed named (`:x`) and positional
   (`?`) SQL placeholders in one statement. The query rejected correctly, but Express 4
   doesn't forward an async handler's rejected promise to error middleware, so the HTTP
   response never sent — the client just hung forever. Fixed the query; added a per-request
   8s timeout safety net in `app.js` so any future instance of this degrades to a clear 500
   instead of a silent hang.
2. **A process crash** — `GET /attempts/:id/result` assumed every question snapshot has an
   `options[]` array, but offline-sourced tests (and the seed's own T1–T6 fixtures) only
   ever freeze `{stem, correct}`. Node 20 crashes the whole process on an unhandled promise
   rejection, so this took down the entire server, not just that one request. Fixed with
   defensive `Array.isArray()` guards; added `process.on('unhandledRejection'/'uncaughtException')`
   handlers in `server.js` as a last-resort net.

Run `npm test` twice in a row in `backend/` — the suite is idempotent (was fixed to be:
a practice-card test used a hardcoded synthetic id with no teardown against the live DB).

## Non-negotiables honoured here
- **No rank / no leaderboard** anywhere — verified live: `curl .../analytics/student/:id/comparison` and `.../toppers` responses contain no `rank` field and no student name, only percentile/`needs_support`/scores. (see [`benchmark.js`](backend/src/algorithms/benchmark.js))
- **Question snapshot** — `client_pl_test_question.question_snapshot_json` freezes questions at test creation.
- **time_sec + visits + changed_count + first_answer** on every response — the fuel for silly-vs-concept, verified end-to-end (an answer-then-change scenario correctly classifies as `overthinking`).
- **Min 3 sample, 90-day recency, 0.4 confidence** gates before any weak-area call.
- **Root cause first**, cycle-guarded, depth-capped — verified against real seeded data (student 900303 reproduces the spec's exact Ch01→Ch03→Ch07 chain from real, not scripted, numbers).
- **Every route** carries `requirePermission`; **every table** carries `org_id`.

See [`docs/ALGORITHMS.md`](docs/ALGORITHMS.md) and [`docs/TAG_CONTRACT.md`](docs/TAG_CONTRACT.md).
