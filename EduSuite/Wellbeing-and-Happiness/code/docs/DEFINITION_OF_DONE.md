# ✅ DEFINITION OF DONE — status against PRD Part 13

Legend: ✅ done & tested · 🔵 built, needs live MySQL to test · ⚠️ human/ops gate

## Guardrails (must all hold)

| Check | Status | Where |
|---|---|---|
| wb_* × exam_result JOIN → throws | ✅ | `assertNoBannedJoin`, guardrails.critical.test |
| wb_* × fees JOIN → throws | ✅ | guardrails.critical.test |
| wb_* × discipline JOIN → throws | ✅ | guardrails.critical.test |
| DB user cannot SELECT academic tables (grant) | 🔵 | 0002 grants, db.integration.test |
| Aggregate < 5 → insufficient_data | ✅ | counsellor.test, audit.staff.test |
| Teacher GET /students/:id/context → 403 | ✅ | routes.auth.test |
| Principal GET /students/:id/context → 403 | ✅ | routes.auth.test |
| Parent GET /students/:id/pulse → 403 | ✅ | routes.auth.test |
| Counsellor without reason → 400 | ✅ | routes.auth.test |
| Counsellor with reason → audit row | ✅ | counsellor.test |
| No /rank /leaderboard /sorted (404) | ✅ | routes.auth.test |
| Journal encrypted (no plaintext at rest) | ✅ | crypto.consent.test |
| Counsellor cannot read unshared journal → 403 | ✅ | crypto.consent.test |
| Audit UPDATE → DB error | 🔵 | 0003 triggers, db.integration.test |
| Audit DELETE → DB error | 🔵 | 0003 triggers, db.integration.test |
| Academic signal alone → max amber, never red | ✅ | signals.test |
| Attendance + academic capped at 40 | ✅ | signals.test |
| Self-raise → always red | ✅ | signals.test |
| Opted-out student → zero rows | ✅ | pulse.journal.test |
| Opted-out invisible to staff | ✅ | engine consent gate, pulse.journal.test |
| Boot fails if a guardrail is broken | ✅ | guardrails.critical.test |
| Guardrail violation → recorded + alerted | ✅ | config/db.js recordViolation |

## Crisis path

| Check | Status |
|---|---|
| Keyword EN / Hindi / Hinglish → red + all-channel alert | ✅ crisis.test |
| Student sees support screen immediately | ✅ crisis.js / CrisisScreen.jsx |
| Crisis screen cannot be dismissed without action | ✅ CrisisScreen.jsx |
| Immediate: 15-min SLA, escalate 5 → 10 min | ✅ crisis.test |
| Escalation counsellor → principal → platform owner | ✅ crisis.test |
| Helplines on every screen | ✅ HelplineBar (always mounted) |
| Crisis overrides consent (logged w/ reason) | ✅ crisis.test |
| Helpline numbers verified working | ⚠️ ops (re-verify every 6 months) |
| Real push/SMS/call gateways | ⚠️ replace responder stubs |

## Consent

| Check | Status |
|---|---|
| Age < 13: parent + child both required; journal disabled | ✅ crypto.consent.test |
| Age 16+: independent consent | ✅ crypto.consent.test |
| Opt-out: one tap, no nag, reason optional | ✅ consent + ConsentScreen |
| Opt-out: anonymized by retention job | ✅ retention (365d), opt-out flips participation |
| Consent screen: "Abhi nahi" as prominent as "Theek hai" | ✅ ConsentScreen.jsx (same class) |

## Functional

| Area | Status |
|---|---|
| Pulse ≤ 10s, one tap, prominent skip, 380px | ✅ PulseCheckIn.jsx |
| Journal hard delete + explicit reversible share | ✅ journal service + Journal.jsx |
| Self-raise → red + 24h SLA | ✅ flags.test |
| Teacher concern → counsellor queue | ✅ concern service |
| Class mood: min-5 with explanation screen | ✅ aggregate + ClassMoodBoard.jsx |
| Circle-time kits (with red-flags section) | ✅ CircleTimeKits.jsx |
| Counsellor queue: priority + SLA | ✅ cases service + CounsellorApp |
| Context view: reason modal every access | ✅ ReasonModal + context |
| Parent loop-in: checklist + mandatory reason | ✅ ParentLoopIn.jsx + cases.loopInParent |
| Anonymous report: no IP/device/session | ✅ reports.test |
| Wellness board: aggregate + "what you cannot see" | ✅ board + PrincipalApp |
| Retention: 365-day anonymization cron | ✅ retention.js + db/jobs/retention.js |

## Contract

| Check | Status |
|---|---|
| Events firing (pulse/flag/self-raise/crisis/...) | ✅ emit points wired |
| Zero cross-module require of client_* tables | ✅ event-only subscribers |
| Zero direct reads of academic/financial tables | ✅ wb user grants + linter |
| Every route has a role guard | ✅ per-route requireRole |
| No hardcoded secrets | ✅ env (.env.example) |

## Delivery

| Item | Status |
|---|---|
| README | ✅ |
| GUARDRAILS.md | ✅ |
| COUNSELLOR_GUIDE.md | ✅ |
| CRISIS_PROTOCOL.md | ✅ |
| Test suite | ✅ 139 passing, 8 suites (+ DB integration suite, opt-in) |
| Frontend builds (all 5 experiences) | ✅ vite build |

## Human review gates (not code — cannot be self-certified)

- [ ] Licensed counsellor: crisis keyword list
- [ ] Licensed counsellor: signal weights
- [ ] Licensed counsellor: all student-facing copy
- [ ] AK Sir: every guardrail + encryption
- [ ] Legal: consent flow
- [ ] Counsellor training material delivered
