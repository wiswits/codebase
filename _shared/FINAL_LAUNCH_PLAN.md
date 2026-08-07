# FINAL_LAUNCH_PLAN.md — the one file every session starts from

> **Mission:** app.wiswits.com — 100% ready to launch for ALL. Every module reachable,
> consistent, safe. JDPS (org 50, real customer) never notices anything.
>
> **This file is the living context.** Every session: read this first, work, then UPDATE
> the checklists + session log at the bottom before ending. No session ends without
> updating this file. Companions: `PRODUCT_PRD.md` (what the product is),
> `intake/ROADMAP.md` (intake sequencing), `CLAUDE.md` (constitution — always wins).

---

## 0. Locked decisions (AK, 2026-08-06)

1. **Manual billing at launch.** Sales = bargain → onboard → invoice → live. The billing
   door 409-ing cleanly is CORRECT behaviour, not a blocker. Automated Razorpay
   subscriptions = post-launch. Billing must never block a launch.
2. **Flow:** intern team's upstream workspace → `intake/` staging folder here → port into `apps/` →
   staging → AK flow-test → gated prod. One module per cycle, never batched.
3. **INTERNS WORK retired** — all content lives in `intake/<Module>/` now.
4. **Module-oriented approach** — uniformity per `PRODUCT_PRD.md` §2 module anatomy.

## 1. Current truth (full 3-way audit, 2026-08-06)

### What's genuinely fine (verified — STOP re-auditing)
- QBank cross-tenant leak **FIXED** on main (single sanctioned `libraryScope.js`, flag-gated).
- Rate limiter now per-user (`u:{org}:{user}`), not per-school-IP.
- Org suspension blocks login/refresh at all three token doors — live on prod.
- Billing webhook: HMAC on raw body, idempotent by DB constraint.
- Backend hygiene: 28 console.logs, 1 TODO, 82 test files. Deploy-prod gates incl. no-undef lint.
- New signups get plan-gating ON from day one (`orgProvisioning.js`).
- No uncommitted work in any of 21 worktrees. Nothing unpushed that matters.

### P0 — real launch blockers (all small)
| # | Blocker | Evidence | Fix scope |
|---|---|---|---|
| P0-1 | **Teacher salary/address/DOB leak** — any teacher reads a colleague's full record | `erp/teachers.routes.js:252` `SELECT u.*` behind `requireStaff`; masks only bank/PAN/Aadhaar | Strip `salary_*`/address/DOB for non-elevated on detail + list routes. One patch. |
| P0-2 | **CI red on every push to main** — ~20 failing assertions (events↔calendar, navConfig↔platform_modules, onboarding provisioning) | last 6 runs on main all `failure` | Triage to green or explicitly quarantine each with a reason. No features on a red gate. |
| P0-3 | **Hand-deploys skip the gates** — SSH :22 blocked from AK's network → Hostinger-console deploys; how migrations 048–051 sat unapplied 3 days | `docs/process/PROD_STATE.md` | Restore SSH or run `deploy-prod.sh` gates verbatim from server console. `migration_gate.js` + parity ALWAYS. |
| P0-4 | **Main→prod gap: 19 commits + 5 SQL migrations + 2 hand-run scripts** not yet deployed | prod/main=`31210d4e`; gap incl. certificates, onboarding P1, pricing 2026 ladder, Org Control Room, fees-assign fix | One planned deploy: apply 062–066 SQL + `041_module_vocabulary_reconcile.js` + `063_pricing_2026.js` by hand first, then deploy. Verify with `schema_inventory.js`. |

### P1 — before the marketing push (not launch-gating)
- Plan gating decorative for legacy orgs (28/29/50 predate provisioning flag). Decision: leave OFF for JDPS (don't disturb); document.
- Second migration system (`scripts/migrations/*.js`): `036_feature_status_enum` UNVERIFIED on prod (Feature Console Suspend may 500). Two files numbered 051. Settle with `schema_inventory.js` server-side.
- Founder price-publish lacks in-action parity check (₹9→₹7.83 was live ~20min once). Add parity inside `accept-suggested`.
- Uploads CORS-403 on prod nginx — backend fix shipped; server nginx unverifiable from laptop. Verify on server.
- `docs/process/PROD_STATE.md` stale (says fe02e7e0; prod is 31210d4e). Refresh at next deploy.

### Reachability (the road to "60 modules live")
- **67 of 75 nav items live today.**
- **5 one-flag flips, FE+BE ready:** Curriculum, Curriculum Setup, Groups, Alumni, Visitors.
  Alumni + Visitors: verify their prod migrations applied FIRST (deploys don't run migrations).
- **4 hidden features to wire** (nav entry only): Institutes/Branches (358-line page, BE live),
  Branding settings (462-line page, BE live), AI report-card comments (admin path),
  PL Engines (minor).
- **2 genuinely unbuilt UI:** Settings→Features toggle page (BE mounted, no page),
  Documents→Files (nothing).
- **1 content-blocked:** My Payslips (needs payroll — SUG-0111, post-launch).

### Branch state
- **`feat/org-lifecycle-archive`** — only substantive unmerged feature (org archive/suspend UI+API+migration). Rebase onto main; **renumber migration 063→067** (collision); reconcile `schema_inventory` EXPECT; tenants-page conflicts expected.
- **`feature/cie-foundation`** — 4 small self-contained fixes, no schema. Easy merge.
- **Delete (verified superseded):** `fix/certificate-simplify`, `fix/certificate-followup`, `feat/comms-meetings-sweep` (merging would *delete* newer main work), `feat/org-control-plane`.
- **`chore/edusuite-intake-staging`** *(branch name predates the rename)* — carries `intake/` (26 modules, code+PRD+STATUS) + `PRODUCT_PRD.md` + this file. **AK decision needed:** merge to main (adds 21MB inert reference to the prod checkout) or keep as the standing intake branch.
- Local `main` behind 1 — pull.

---

## 2. The 3-day plan

> Honest scope: 3 days makes the EXISTING platform launch-ready — hardened, deployed,
> promoted, consistent. The 26-module intake conveyor continues at one/cycle AFTER
> launch (Phase 2+ of `intake/ROADMAP.md`); it is intake work, not launch work.

### Day 1 — Harden & assemble (repo work, no prod touch)
- [ ] P0-1 salary-masking patch + test (detail + list routes)
- [ ] P0-2 CI triage → green (fix or quarantine-with-reason each failing suite)
- [ ] Pull local main; merge `feature/cie-foundation`
- [ ] Rebase `feat/org-lifecycle-archive`: renumber 063→067, reconcile schema_inventory, resolve tenants-page; merge
- [ ] Delete 4 superseded branches (after `git cherry` re-verify)
- [ ] Wire nav entries: Branding settings + Institutes (canonical pages + navConfig, `soon:true`)
- [ ] Build deploy manifest: ordered list of 062–067 SQL + 2 hand-run JS scripts, each with its verify query
- [ ] AK decision: intake staging branch → main, or standing branch

### Day 2 — Stage, verify, deploy
- [ ] Deploy main → staging; apply staging migrations
- [ ] AK flow-test on staging: 5 soon-flips + salary fix + org lifecycle + certificates + onboarding P1 — as admin, teacher, STUDENT, parent (student-surface blind spot is a known trap)
- [ ] Prod: apply migration manifest by hand (`migration_gate.js` first, `schema_inventory.js` after)
- [ ] Prod deploy (gates honoured verbatim — console or SSH), health checks, rollback point
- [ ] Refresh `docs/process/PROD_STATE.md` with new prod commit + applied-migration list
- [ ] Verify prod as each role incl. one real teacher + one real student login path

### Day 3 — Promote, polish, green-signal
- [ ] Flip the 5 `soon:true` flags (Curriculum, Setup, Groups, Alumni, Visitors) after prod flow-test → **~72 modules-surface live**
- [ ] Verify uploads CORS on prod nginx (plain `<img>` from app origin)
- [ ] Verify `036_feature_status_enum` on prod (Feature Console suspend path)
- [ ] Manual-billing runbook: bargain → owner-console invoice → org activation, one page in `docs/process/`
- [ ] Legacy-org gating decision documented (JDPS untouched)
- [ ] Full green-signal checklist (below) — every box or a written reason
- [ ] Update this file: session log, flip Phase status, set next-session pointer
- [ ] START the conveyor: `intake/Wellbeing-and-Happiness` cycle 1 begins (post-launch cadence)

## 3. Green-signal criteria (launch = ALL boxes)

- [ ] P0-1..P0-4 closed
- [ ] CI green on main
- [ ] Prod == main, migrations verified by `schema_inventory.js`
- [ ] All 5 promotions live on prod, flow-tested per role
- [ ] No navConfig entry that 404s; nav gate tests green
- [ ] JDPS spot-check: login, attendance, fees, report card — untouched behaviour
- [ ] Manual billing runbook exists and owner-console invoice flow works
- [ ] `PROD_STATE.md` current; this file current
- [ ] Zero `alert()`/`confirm()` on any shipped page; six loading states spot-checked on promoted pages
- [ ] My green signal, in writing, in the session log below

## 4. After launch — the standing conveyor (summary; detail in intake/ROADMAP.md)

Week-by-week, one module per cycle, PRD-diffed, same gate every time:
Wellbeing → Personalised Learning (as recovery-v2) → Hostel → Asset & Inventory → HPC
Report Card → then P1 overlaps (Recruitment, PMS-scoped, Coaching-mined, EMPS-delta,
Exam-ops, Payroll-only) → P2 dedups (Certificates-reject, Library-diff, Alumni-3-way,
Admissions-reject) → holds stay held until unblocked (Student Observations, Utilization,
Biometric, Communication-Admin, Medical Room §16, SQAAF).

## 5. Session protocol (how we never lose context)

1. **Start:** read this file top to bottom. Trust its "current truth" over memory notes.
2. **Work:** move checkboxes. If audit findings change (something fixed/broken), edit §1.
3. **End:** update session log below — date, what moved, what's next, any new decision.
   Commit this file with the work it describes.

---

## Session log

**S1 — 2026-08-06 (this session).** Full portfolio mapped: intern team's upstream workspace (14 concepts) +
independent repos (12 modules, incl. 2 local-only Anil builds found in INTERNS WORK) +
Khushboo's 12 PRD sets. `Modules_Repo` consolidated upstream (intern team's upstream workspace main).
`intake/` staging folder created here — 26 modules × code+PRD+STATUS.md. INTERNS WORK
verified-parity and retired. `PRODUCT_PRD.md` written (60-module catalog, module anatomy,
manual-billing lock). 3-way deep audit run (blockers / reachability / branches) — results
folded into §1. **Next session: Day 1 checklist, top to bottom. Start with P0-1 salary
patch.** Open AK decisions: (a) merge intake branch to main or keep standing; (b) exact
launch date for the marketing push.
