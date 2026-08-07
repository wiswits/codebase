# 🛡 GUARDRAILS — the promises, and how the code keeps them

> Ye constants nahi hain. Ye waade hain.
> These are not constants. They are promises. Each was learned from someone's
> mistake, somewhere, with some child. We will not repeat it.

Changing anything here requires (1) AK Sir's written approval, (2) a licensed
counsellor's review, (3) a reason written down. "The client is asking for it"
is not a reason.

## Where each promise lives

| Promise | Enforced by | File |
|---|---|---|
| Mood never joins marks/fees/discipline (Waada 1) | query linter + DB grants + tests | [`wellbeing.guardrails.js`](../apps/backend/src/modules/wellbeing/wellbeing.guardrails.js), [`0002_wb_user_and_grants.sql`](../apps/backend/db/migrations/0002_wb_user_and_grants.sql) |
| Teacher never sees an individual (Waada 2) | role gate; aggregate min-5 | `assertCanSeeIndividual`, `assertAggregateSize` |
| Journal is the student's alone (Waada 3) | AES-256-GCM per-student key | *Week 2 — `wellbeing.crypto.js`* |
| Never a tool for punishment (Waada 4) | no FK/API/export to discipline | schema (no discipline FK), route registry |
| You can always say no (Waada 5) | opt-out, zero penalty, invisible | *Week 2 — consent* |
| Aggregates hide groups < 5 | `assertAggregateSize` (hardcoded 5) | `wellbeing.guardrails.js` |
| Individual reads require a reason, always audited | role gate + append-only audit | `assertCanSeeIndividual`, audit triggers |
| Audit log is append-only | DB triggers (block UPDATE/DELETE) | [`0003_wb_audit_triggers.sql`](../apps/backend/db/migrations/0003_wb_audit_triggers.sql) |
| Academic signals alone can never go red | hard caps (25 + 15 = 40 < 60) | *Week 5 — signal engine* |
| Self-raise is always red | `SELF_RAISE_ALWAYS_RED` | *Week 5 — signal engine* |
| No ranking endpoints exist | route registry + boot check | [`wellbeing.boot.js`](../apps/backend/src/modules/wellbeing/wellbeing.boot.js) |

## Defence in depth (Waada 1, worked example)

A query joining mood with marks is stopped **three** times:

1. **In code** — `assertNoBannedJoin` runs on every wb query via the `wbDb`
   wrapper in [`config/db.js`](../apps/backend/src/config/db.js) and throws
   `GuardrailViolation` before the query is sent.
2. **At the database** — the `wiswits_wb` user has *no grant* on
   `client_exam_result` et al., so MySQL rejects it even if code is bypassed.
3. **In tests** — `tests/guardrails.critical.test.js` asserts both the linter
   throws and (later weeks) the grant denies.

## Boot refuses to start if a promise is broken

`verifyGuardrailsAtBoot` checks, before the server listens:

- no ranking/prediction/export-all routes are mounted,
- the journal master key is real (not the default),
- crisis guardrails are enabled,
- (with DB) the wb user's grants exclude the banned tables,
- (with DB) the audit table has its append-only triggers.

Any failure → the process exits non-zero. See
[`server.js`](../apps/backend/src/server.js).

## The status of each Part-13 guardrail check

Run `npm test` in `apps/backend`. Week 1 ships the pure primitives (linter,
aggregate guard, role/reason gate, boot check). The DB/HTTP integration forms
are present as `it.todo` in the test file and are filled in as their features
land (grants → now testable post-migration; encryption → Week 2; signal caps →
Week 5; endpoint 404s + audit rows → Weeks 6–10).
