# Roadmap — 60 Modules, Fully Working, In Prod

**Goal:** every module wiswits-code has (or should have) is not just built but actually
*live and usable* for a real school — not sitting behind `soon:true`, not a stub with no
nav entry, not a duplicate competing with something else we already ship.

This is the sequencing plan. It does not override the constitution — §13.1 (staging first,
always), §21 (the `soon:true` lifecycle), and the intake pipeline's **one module per weekly
cycle, never batch 4–5** rule (`docs/pipeline/README.md`) all still apply. This roadmap is
the order to run that pipeline in, not a replacement for it.

---

## The starting count

- **~34 of ~60 native modules are genuinely live** for a real school today.
- The rest are either `soon:true` (built, gated), have no nav entry at all (built, but
  nobody can reach them — a bug per §21: *"a working page with no navConfig entry for its
  intended roles is a hidden feature"*), or are intentionally internal (owner console,
  platform playbooks — not customer-facing by design, don't count these toward 60).
- **26 intern/EduSuite module concepts** exist on top of that, at every stage from
  "just a contract, zero code" to "fully built, sitting in `Modules_Repo` with a PRD."

Two different kinds of work close the gap to 60:
1. **Reachability work** — native modules that already exist but aren't actually usable
   (no nav entry, or `soon:true` on prod with nobody having flow-tested it).
2. **Intake work** — the 26 intern modules, each needing its own dedup/build/reject call
   before it's ever a PRs to wiswits-code.

---

## Phase 0 — Housekeeping (mostly done)

- [x] Consolidate every intern module into one place with code + PRD + status
      (`EduSuite/` in this repo, mirrored from `Modules_Repo`/`Modules_Repo_PRD` in the
      EduSuite repo).
- [x] Cross-reference all 26 concepts against native wiswits-code — done, see each
      module's `STATUS.md`.
- [ ] **Audit the ~26 non-intern native modules that are `soon:true` / no-nav-entry /
      partial** (Groups, Curriculum/CIE, Teaching Canvas, Student Lifecycle, Parent
      Linking, School/Branch Mgmt, Resources, etc.) and give each one a `STATUS.md` too,
      same format — "reachability work" needs the same tracking discipline as "intake work."

## Phase 1 — Finish what's already in flight (1 cycle)

- [ ] **Visitor Management** — code is done, merged to `main`, sitting behind `soon:true`.
      Zero new porting. Do this first: flow-test on staging as every role, then drop
      `soon: true` in `navConfig.ts` (§21 promotion = that one flag flip).

## Phase 2 — Genuine gaps, highest quality builds (P0, ~1 cycle each)

Order by build maturity — the better-tested ones set the template for the rest, same as
Event Management did originally.

1. [ ] **Wellbeing & Happiness** (Anil) — most complete build in the portfolio, guardrails
       already documented, one security pass already run against it once in this repo.
2. [ ] **Personalised Learning** (Anil) — 163 tests, but this one **upgrades** the native
       `recovery` module rather than adding a parallel one. Scope the port as "recovery v2,"
       not a new module.
3. [ ] **Hostel Management** (Ankit) — most mature build overall (RLS, cross-tenant tests).
       Fills a real Phase-1 slot (§8) that's currently empty.
4. [ ] **Asset & Inventory** (Jatin & Sunidhi) — same: fills an empty Phase-1 slot.
5. [ ] **HPC Report Card** (EduSuite) — genuinely distinct from our report card (NEP
       holistic format). Already the agreed first pick from EduSuite's own assemblies.

## Phase 3 — Overlap modules, upgrade native rather than duplicate (P1)

These already have a live-ish native answer. The work here is scoping what to *add*, not
building from scratch.

- [ ] **Recruitment Management** — no native equivalent at all despite sitting in the
      "overlap" bucket loosely (HR-adjacent) — treat as a real gap, but lower urgency than
      Phase 2's genuine gaps.
- [ ] **HR-PMS** — scope down before porting. Full goal/review-cycle workflows risk reading
      as generic corporate HR (§16 non-goal). Decide what a *school-sized* version looks
      like before writing any code.
- [ ] **Coaching & Test Series** — don't port wholesale. Mine batches/OMR/doubts/error-book
      as additions to existing `lms`/`qbank`/`quiz-portal`.
- [ ] **EMPS** — check overlap against `hr` in detail; only the chat/task/meeting pieces
      are genuinely missing.
- [ ] **Exam Cell & Result Management** — evaluate as an exam-*operations* layer (hall
      tickets, seating, invigilation) on top of `erp`'s existing assessments/reportcards,
      not a replacement for them.
- [ ] **HRMS & Payroll** — the only real gap here is Payroll itself (currently a
      placeholder tab). Leave/attendance/staff are already native — scope the port to
      payroll only.

## Phase 4 — Dedup reconciliation, no new code (P2)

These need a decision and possibly a merge, not a port.

- [ ] **Certificates & Documents** — reject. We run a live certificate engine; confirm
      nothing in the intern build is worth cherry-picking, then close it out.
- [ ] **Library Management** — feature-by-feature diff against `erp/library`; port only
      confirmed gaps.
- [ ] **Alumni — Directory & Network** — three builds now exist (native table, EduSuite's
      Alumni-Directory already ported, Neha's Alumni Network & Mentorship). One
      reconciliation session, one decision, not another port.
- [ ] **Admission Management** + **Registration Management** — reject both. Confirm there's
      nothing salvageable beyond the two ideas already flagged (a real number-series
      generator, a document checklist) — pull those two pieces into the native `admissions`
      module directly if useful, nothing else.

## Phase 5 — Blocked upstream (not wiswits-code's move yet)

- [ ] **Student Observations**, **Utilization Management** — EduSuite's own team hasn't
      assembled these past `incoming/` yet. Nothing to port until Khushboo merges a
      `final/` build. Check back each cycle; don't start early on a moving target.
- [ ] **Biometric Attendance**, **Communication Administration**, **HR Payroll**
      (EduSuite's contract) — zero code exists anywhere for these three. Same as above:
      nothing to do until a build exists. Communication Administration especially — likely
      redundant against native comms even once built, confirm before anyone spends a cycle
      writing it.

## Phase 6 — Explicitly on hold, needs AK

- [ ] **Medical Room** — real feature, but `§16`-gated as a non-goal until Phase 1 is
      stable. Don't schedule a cycle for this without an explicit go-ahead.
- [ ] **SQAAF** — not on the Phase-1 module list at all (§8). Needs a menu/scope decision
      before it's even a candidate, separate from build-quality.

---

## The per-module checklist (repeat for every cycle)

Same gate every module goes through, proven on Event/Alumni/Visitor:

1. Read `EduSuite/<Module>/STATUS.md` — confirm the verdict still holds (native side may
   have changed since this was written).
2. Diff `PRD/` against `code/` — build what was actually delivered, not what was promised.
3. Run `scripts/intake/check-module.sh` against the source — BLOCKER findings send it back,
   REVIEW findings need a human look, PORT-ADAPTER findings are the expected swap list
   (auth, DB pool, routing, etc.) — see `docs/pipeline/INTAKE_STANDARD.md`.
4. Port: own `modules/<name>/` folder, descriptor in `core/registry.js`, migration(s) in
   `apps/backend/migrations/` (immutable, no `USE`), permissions in the catalog, audit log
   calls on every mutating action.
5. Frontend: canonical page at `app/(dashboard)/<module>/page.tsx`, `navConfig.ts` entry
   with the right `roles`, `soon: true` until prod-blessed (§21).
6. Tests green (unit + integration), `tsc` clean.
7. Deploy to staging (`scripts/deploy-staging.sh`) — AK flow-tests every relevant role.
8. Only after that: gated prod deploy (`scripts/deploy-prod.sh`, `main` only, typed
   confirmation), then drop `soon: true`.

**Never batch more than one module through this at a time** — bisectability and rollback
depend on it, per the pipeline's own README.

---

## What "60, fully working" actually means when this is done

- Every native module either has a real nav entry with no `soon:true` and no "chrome/
  internal only" excuse, or is deliberately internal (owner console, playbooks) and
  labeled as such.
- Every one of the 26 intern concepts has an explicit, current verdict — ported, merged
  into an existing module, or explicitly rejected/held with a reason — never just "sitting
  there."
- Nothing is duplicated: one certificate engine, one alumni system, one admissions
  pipeline, one report-card system (with HPC as a distinct template inside it, not a
  parallel product).
